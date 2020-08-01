#!/bin/bash

if [ -z "$1" ]
  then
    echo "[usage] populate.sh [target binary path]"
    exit 1
fi

tmux new-session -s corpus -d \
        './fuzz/scripts/run-all.py -- ./fuzz/afl/afl-fuzz -m none -o output \
        -i ./corpus/output \
        '$1' @@'

