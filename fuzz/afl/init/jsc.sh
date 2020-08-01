#!/bin/bash

if [ -z $1 ] || [ -z $2 ] || [ -z $3 ]; then
    echo "usage: $0 [cpu count] [corpus dir] [output dir]"
    exit 1
fi

for i in $(seq 0 1 $(($1 - 1)))
do
    tmux new-window -n corpus-$i \
        ../afl-fuzz -m none -o $3/output-corpus-$i -i $2/output-$i -- \
        ../../../engines/webkit-afl/WebKitBuild/Debug/bin/jsc \
        --validateOptions=true \
        --useConcurrentJIT=false \
        --useConcurrentGC=false \
        --thresholdForJITSoon=10 \
        --thresholdForJITAfterWarmUp=10 \
        --thresholdForOptimizeAfterWarmUp=100 \
        --thresholdForOptimizeAfterLongWarmUp=100 \
        --thresholdForOptimizeAfterLongWarmUp=100 \
        --thresholdForFTLOptimizeAfterWarmUp=1000 \
        --thresholdForFTLOptimizeSoon=1000 \
        --gcAtEnd=true \
        ../../../../js-samples/lib.js \
        ../../../../js-samples/chakra.js \
        ../../../../js-samples/jsc.js \
        ../../../../js-samples/ffx.js \
        ../../../../js-samples/v8.js \
        @@ 
done
