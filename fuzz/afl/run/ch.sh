#!/bin/bash

if [ -z $1 ] || [ -z $2 ]; then
    echo "usage: $0 [cpu count] [fuzz dir]"
    exit 1
fi

for i in $(seq 0 1 $(($1 - 1)))
do
    echo tmux new-window -n fuzz-$i \
        ../afl-fuzz -m none -o $2/output-$i -- \
        ../../../engines/chakracore-master/out/Debug/ch \
        -lib=/home/soyeon/jsfuzz/js-samples/lib.js \
        -lib=/home/soyeon/jsfuzz/js-samples/jsc.js \
        -lib=/home/soyeon/jsfuzz/js-samples/ffx.js \
        -lib=/home/soyeon/jsfuzz/js-samples/v8.js \
        @@ 
done
