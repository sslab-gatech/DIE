#!/bin/bash

if [ -z $1 ]; then
    echo "usage: $0 [cpu count]"
    exit 1
fi

for i in $(seq 0 1 $(($1 - 1)))
do
     tmux kill-window -t fuzz-$i
     tmux kill-window -t corpus-$i
done
