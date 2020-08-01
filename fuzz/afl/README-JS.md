NOTE:
When compiling llvm_mode with clang version >= 3.8, there is an issue: 
https://groups.google.com/forum/#!topic/afl-users/D3-jbylxHeg

I currently use clang-6.0 and compile llvm_mode
make CC=clang CXX=g++ LLVM_CONFIG=llvm-config-6.0

* Compile Type Script
```bash
# TODO: Use ts-node, instead of nodejs
$ cd ../TS
$ tsc
```

* Populate initial testcases

```bash
$ ../scripts/make_initial_corpus.py $(JS_SAMPLES_DIR) corpus |cpu count|

$ for i in $(seq 0 1 $(nproc))
do
    tmux new-window -n corpus-$i \
        ./afl-fuzz -m none -o output-corpus-$i -i corpus/output-$i -- $CMDLINE
done
```

* Run fuzzer

```bash
$ for i in $(seq 0 1 $(nproc))
do
    tmux new-window -n fuzz-$i \
        ./afl-fuzz -m none -o output-$i -- $CMDLINE
done
```

* Run in remote server

```bash
# Setup SSH tunneling for redis (e.g., connect to localhost:9000)
tmux new-session -s ssh-tunneling -d \
    'ssh -L 9000:localhost:6379 user@redis.server'

export REDIS_URL=redis://localhost:9000

# Then, run fuzzers as before
```
