#!/usr/bin/env python3
import argparse
import os
import multiprocessing
from os import environ

environ["REDIS_URL"] = "redis://localhost:9000"


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('cmd', nargs='+')
    p.add_argument('--cpu', nargs='?', type=int, default=int(multiprocessing.cpu_count() - 4))
    cmd = p.parse_args().cmd
    assert('output' in cmd)
    for i in range(p.parse_args().cpu):
        new_cmd = ' '.join(cmd).replace('output', 'output-%d' % i)
        os.system('tmux new-window -n jsfuzz-%d "AFL_NO_UI=1 REDIS_URL=redis://localhost:9000 %s; /bin/bash"' % (i, new_cmd))
