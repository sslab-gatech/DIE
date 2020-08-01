#!/bin/bash

if [ -z $1 ] || [ -z $2 ] || [ -z $3 ]; then
    echo "usage: $0 [cpu count] [corpus dir] [output dir]"
    exit 1
fi

for i in $(seq 0 1 $(($1 - 1)))
do
        tmux new-window -n corpus-$i \
        ../afl-fuzz -m none -o $3/output-corpus-$i -i $2/output-$i -- \
        ../../../engines/chakracore-master/out/Debug/ch \
        -lib=/home/soyeon/jsfuzz/js-samples/lib.js \
        -lib=/home/soyeon/jsfuzz/js-samples/chakra.js \
        -lib=/home/soyeon/jsfuzz/js-samples/jsc.js \
        -lib=/home/soyeon/jsfuzz/js-samples/ffx.js \
        -lib=/home/soyeon/jsfuzz/js-samples/v8.js \
        @@ 
done
