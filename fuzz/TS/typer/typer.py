import subprocess, os, sys, tempfile, json
import resolve

# I prefer to use d8 to run the instrumented code, 
# which should be fastest I believe.

d8_path = "/home/soyeon/jsfuzz/js-static/engines/v8-latest/v8/out/Release/d8"

def get_lib(path):
    if path.find("ChakraCore/") != -1 or path.find("chakra/") != -1:
        return "./jslib/chakra.js"
    elif path.find("spidermonkey/") != -1 or path.find("firefox/") != -1:
        return "./jslib/ffx.js"
    elif path.find("jsc/") != -1:
        return "./jslib/jsc.js"
    elif path.find("v8/") != -1:
        return "./jslib/v8.js"
    else:
        return ""

if __name__ == "__main__":

    target = sys.argv[1]
    FNULL = open(os.devnull, 'w')

    if os.path.isdir(target):
        for root, dir, files in os.walk(target):
            for f in files:
                if not f.endswith(".js"): continue
                full_path = os.path.join(root, f)
                ins_path = full_path + ".jsi"
                type_path = full_path + ".t"

                if os.path.isfile(type_path):
                    print('The type file for %s exists.')
                    continue

                print('Instrumenting: %s' % full_path)
                try:
                    subprocess.call(['ts-node', 'typer.ts', full_path, ins_path], stdout=FNULL)
                except:
                    print('Instrumentation failed')
                    continue
                print('Instrumentation finished')
                
                print('Profiling: %s' % full_path)
                output = None
                lib = get_lib(full_path)
                if not os.path.exists(d8_path):
                    print("Wrong d8_path. Set correct d8_path.")
                    exit()
                cmd = [d8_path]
                if len(lib) > 0:
                    cmd.append(lib) 
                cmd.append(ins_path)
                output = None
                try:
                    output = subprocess.check_output(cmd, timeout=30)
                except subprocess.TimeoutExpired as e:
                    output = e.output 
                except subprocess.CalledProcessError as e:
                    output = e.output

                print('Profiling finished')
                records = resolve.resolve(output)
                if len(records) > 0:
                    with open(type_path, 'wb') as f:
                        f.write(json.dumps(records).encode())
    else:
        print("Wrong corpus directory path")

    FNULL.close()
