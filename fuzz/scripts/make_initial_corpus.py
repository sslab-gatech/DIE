#!/usr/bin/env python3
import multiprocessing
import argparse
import glob
import os
import sys
import shutil

"""
Save initial files alphabeticall sorted according to their size
to be used for initial corpus generation
"""

def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument('input_dir')
    p.add_argument('output_dir')
    #p.add_argument('n_cpu')
    return p.parse_args()

def main():
    args = parse_args()

    if os.path.exists(args.output_dir):
        print('[-] Output directory already exists: %s' % args.output_dir)
        sys.exit(-1)

    os.makedirs(args.output_dir)

    files = []
    for f in glob.glob(args.input_dir + '/**/*.js', recursive=True):
        if not os.path.isfile(f):
            continue

        if not os.path.exists(f + ".t"):
            continue

        if os.path.getsize(f) == 0:
            continue
        files.append(f)

    files = sorted(files, key=lambda f: os.path.getsize(f))
    # TODO: Use a single configuration file for javascript and python
    files = list(filter(lambda f: os.path.getsize(f) < 128 * 1024, files))

    n_cpu = multiprocessing.cpu_count() - 4
    #n_cpu = int(args.n_cpu)
    splits = [[] for i in range(0, n_cpu)]
    for i in range(0, len(files), n_cpu):
        for j in range(n_cpu):
            if i + j < len(files):
                splits[j].append(files[i + j])

    for i, per_cpu_files in enumerate(splits):
        per_cpu_dir = os.path.join(args. output_dir, 'output-%d' % i)
        os.makedirs(per_cpu_dir)
        for j, f in enumerate(per_cpu_files):
            shutil.copy(f, os.path.join(per_cpu_dir, "%06d-corpus.js") % j)
            shutil.copy(f + ".t", os.path.join(per_cpu_dir, "%06d-corpus.js.t") % j)

if __name__ == '__main__':
    main()
