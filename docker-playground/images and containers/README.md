# Lesson 01 - Images and Containers

## Goal

Understand the difference between images and containers.

---

## Experiments

### Experiment 1
Command:
docker run postgres:16

Observation:
- Container was created.
- PostgreSQL exited with code 1. -> exited unsucessfully.

Reason:
- The official PostgreSQL image requires initialization values such as POSTGRES_PASSWORD.
- Since they weren't supplied, PostgreSQL refused to initialize and exited with code 1.

---

### Experiment 2
Command:
docker run mongo:7

Observation:
- MongoDB started.
- Ctrl+C stopped the main process.
- Container exited with code 0. -> exited successfully.

Reason:
- The official MongoDB image can start without authentication if no credentials are supplied.
- The container stopped because I interrupted the foreground process with Ctrl+C.

---

## REALISATIONS
- docker run creates a new container, not reuse an existing one.
- Docker creates the container even if the application inside fails.
- Exit code 0 means graceful exit.
- Exit code 1 usually means an application error.
- A container lives as long as its main process lives. -> process is important. For os like ubuntu, porcess is echo, bash, for db like mongod , the docker run mongod itself is a process on its own.
- Images are templates; containers are disposable instances.
- docker inspect shows both the configuration we supplied and runtime information Docker generated.
- Every image defines a default process (CMD/ENTRYPOINT). A container runs only while that process is alive. Images like PostgreSQL start a database server automatically, while minimal images such as Alpine need a command (e.g. `sh`, `echo`, or `sleep infinity`) to keep the container running.

## commands
``` 
docker images
docker ps
docker ps -a
docker inspect <container>
docker logs <container>
docker rm <container>
docker stop <container>
docker run <image> {default runs foreground shows all logs as it runs}
docker run -d <image> {detached: runs in background hence does not show logs}
```


               IMAGE
        -------------------
        /
        hello.txt
        Dockerfile result
        alpine linux
        cat command
        -------------------
                ▲
                │ Read Only
                │
        ┌───────┴────────┐
        │                │
        │                │
   Container A      Container B
   ------------     ------------
   writable         writable
   layer            layer