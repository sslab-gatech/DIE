#!/bin/bash

if [ -z "$1" ]
  then
    echo "[usage] run.sh [target binary path]"
    exit 1
fi

tmux new-session -s fuzzer -d \
        './fuzz/scripts/run-all.py -- ./fuzz/afl/afl-fuzz -m none -o output \
        '$1' @@'
