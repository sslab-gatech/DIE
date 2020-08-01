# DIE

Repository for "DIE: Fuzzing JavaScript Engines with Aspect-preserving Mutation" (in S&P'20). You can check the [paper](https://gts3.org/assets/papers/2020/park:die.pdf) for technical details. 


## Environment

Tested on Ubuntu 18.04 with following environment.
* Python v3.6.10
* npm v6.14.6
* n v6.7.0

## General Setup

For nodejs and npm,
```
sudo apt-get -y install npm
sudo npm install -g n
sudo n stable
```
For redis-server,
```
sudo apt install redis-server
```
we choose clang-6.0 to compile afl and browsers smoothly.
```
sudo apt-get -y install clang-6.0
```

## DIE Setup

To setup environment for AFL,
```
cd fuzz/scripts
sudo ./prepare.sh
```

To compile whole project,
```
./compile.sh
```

### Server Setup
* Make Corpus Directory
(We used [Die-corpus](https://github.com/sslab-gatech/DIE-corpus.git) as corpus)
```
git clone https://github.com/sslab-gatech/DIE-corpus.git
python3 ./fuzz/scripts/make_initial_corpus.py ./DIE-corpus ./corpus
```
* Make ssh-tunnel for connection with redis-server
```
./fuzz/scripts/redis.py
```
* Dry run with corpus
```
./fuzz/scripts/populate.sh [target binary path]
```
It's done! Your corpus is well executed and the data should be located on redis-server.

#### Tips
To check the redis-data,
```
redis-cli -p 9000
127.0.0.1:9000> keys *
```
If the result contains fuzzers:fuzzer-* keys, the fuzzer was well registered and executed.

You can check the corpus is being executed with below command as well.
```
tmux ls
```
If a session named corpus exists, it's still executing corpus.
### Client Setup
* Make ssh-tunnel for connection with redis-server
```
./fuzz/scripts/redis.py
```

* Usage
```
./fuzz/scripts/run.sh [target binary path]
```

* Check if it's running
```
tmux ls
```
You can find a session named fuzzer if it's running.
