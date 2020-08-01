import * as argparse from "argparse";
import * as assert from "assert";
import * as async from "async";
import * as fs from "fs";
import { ClientRequest } from "http";
import * as path from "path";
import * as redis from "redis";
import * as config from "./config";

function createRedisClient(): redis.RedisClient {
    // console.log(process.env.REDIS_URL);
    return redis.createClient(process.env.REDIS_URL);
}

function readCovDiffFile(covDiffFile: string) {
    // CovDiffFile's format => p32(numberOfDiffs)
    //                             || (p32(index) || p32(value)) * numberOfDiffs
    const covFd = fs.openSync(covDiffFile, "r");
    const lengthBuffer = Buffer.alloc(4);

    assert(fs.readSync(covFd, lengthBuffer, 0, 4, null) === 4);

    const covLength = lengthBuffer.readUInt32LE(0);

    assert(covLength <= config.BITMAP_SIZE);

    const covBuffer = Buffer.alloc(8 * covLength);

    assert(fs.readSync(covFd, covBuffer, 0, 8 * covLength, null) === 8 * covLength);

    // Don't return empty array (then it will fails at sadd)
    const cov = ["0"];
    for (let i = 0; i < covLength; i += 1) {
        const index = covBuffer.readUInt32LE(8 * i);
        const value = covBuffer.readUInt32LE(8 * i + 4);

        for (let j = 0; j < 8; j++) {
            if (value & (1 << j)) {
                cov.push((index * 8 + j).toString());
            }
        }
    }

    fs.closeSync(covFd);
    return cov;
}

function downloadBitmap(bitmapType: string, bitmapFile: string) {
    const client = createRedisClient();
    const buffer = Buffer.alloc(config.BITMAP_SIZE, 0);

    async.waterfall([
        (callback: any) => {
            client.smembers(bitmapType, (err, res) => { callback(err, res); });
        },
        (keys: string[], callback: any) => {
            // tslint:disable-next-line: prefer-for-of
            for (let i = 0; i < keys.length; i++) {
                const key = parseInt(keys[i], 10);
                buffer[key / 8 | 0] |= 1 << (key % 8);
            }
            callback(null);
        }],
        () => {
            fs.writeFileSync(bitmapFile, buffer);
            client.quit();
        },
    );
}

function insertFileWithCovDiff(bitmapType: string, queueType: string, jsFile: string, covDiffFile: string) {
    if (!fs.existsSync(jsFile)) {
        console.log("[-] insertPath - Cannot find a js file: " + jsFile);
        return;
    }

    const typeFile = jsFile + ".t";

    if (!fs.existsSync(typeFile)) {
        console.log("[-] insertPath - Cannot find a type file: " + typeFile);
        return;
    }

    const fileObj = {
        js: fs.readFileSync(jsFile).toString(),
        type: fs.readFileSync(typeFile).toString(),
    };

    const client = createRedisClient();
    const cov = readCovDiffFile(covDiffFile);

    async.waterfall([
            (next: any) => { client.sadd(bitmapType, cov, (err: any, res: number) => { next(err); }); },
            (next: any) => {
                client.lpush(queueType, JSON.stringify(fileObj), (err: any, res: number) => { next(err); });
            },
        ],
        (err: any) => { client.quit(); },
    );
}

function getNextTestcase(jsFile: string) {
    const typeFile = jsFile + ".t";
    const client = createRedisClient();

    async.waterfall(
        [ (next: any) => {
            client.rpoplpush("newPathsQueue", "oldPathsQueue",
                (err: any, res: string) => {
                    if (err) {
                        return next(err, res);
                    }

                    if (res) {
                        const fileObj = JSON.parse(res);
                        fs.writeFileSync(jsFile, fileObj.js);
                        fs.writeFileSync(typeFile, fileObj.type);
                        next(true); // Early finish
                    } else {
                        next(err);
                    }
                },
            );
        },
        (next: any) => {
            client.rpoplpush("oldPathsQueue", "oldPathsQueue",
                (err: any, res: string) => {
                    if (err) {
                        return next(err, res);
                    }

                    if (res) {
                        const fileObj = JSON.parse(res);
                        fs.writeFileSync(jsFile, fileObj.js);
                        fs.writeFileSync(typeFile, fileObj.type);
                    } else {
                        console.log("[-] getNextTestcase - Need to populate first");
                    }
                    next(err);
                });
        }],
        (err: any) => { client.quit(); },
    );
}

function reportStatus(fuzzerId: string, fuzzerStats: string) {
  const client = createRedisClient();
  const stats = fs.readFileSync(fuzzerStats).toString();

  async.waterfall([
      (callback: any) => {
        client.sadd("fuzzers", fuzzerId,
            (err: any, res: any) => { callback(err, res); });
      },
      (_: any, callback: any) => {
        client.set("fuzzers:" + fuzzerId, stats,
            (err, res) => { callback(err, res); });
      }],
      (err, res) => { client.quit(); });
}

function parseArgs() {
    const parser = new argparse.ArgumentParser();
    const subparsers = parser.addSubparsers({
        dest: "command",
    });

    const downloadBitmapParser = subparsers.addParser("downloadBitmap");
    downloadBitmapParser.addArgument("bitmapType", { choices: ["pathBitmap", "crashBitmap"] });
    downloadBitmapParser.addArgument("bitmapFile");

    const insertPathParser = subparsers.addParser("insertPath");
    insertPathParser.addArgument("jsFile");
    insertPathParser.addArgument("covDiffFile");

    const insertCrashParser = subparsers.addParser("insertCrash");
    insertCrashParser.addArgument("jsFile");
    insertCrashParser.addArgument("covDiffFile");

    const getNextTestcaseParser = subparsers.addParser("getNextTestcase");
    getNextTestcaseParser.addArgument("jsFile");

    const reportStatusParser = subparsers.addParser("reportStatus");
    reportStatusParser.addArgument("fuzzerId");
    reportStatusParser.addArgument("statFile");

    return parser.parseArgs();
}

(() => {

    const args = parseArgs(); 

    if (args.command === "downloadBitmap") {
        downloadBitmap(args.bitmapType, args.bitmapFile);
    } else if (args.command === "insertPath") {
        insertFileWithCovDiff("pathBitmap", "newPathsQueue", args.jsFile, args.covDiffFile);
    } else if (args.command === "insertCrash") {
        insertFileWithCovDiff("crashBitmap", "crashQueue", args.jsFile, args.covDiffFile);
    } else if (args.command === "getNextTestcase") {
        getNextTestcase(args.jsFile);
    } else if (args.command === "reportStatus") {
        reportStatus(args.fuzzerId, args.statFile);
    } 
})();
