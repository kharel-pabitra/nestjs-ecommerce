# Lesson 04 - Dockerfiles

## Goal

Understand what a Dockerfile actually is and how it differs from a running container.

---

## Experiments

### Experiment CMD

Dockerfile

```dockerfile
FROM alpine

CMD ["echo", "Hello World!"]
```

Command

```bash
docker build -t echo-alpine .
```

Observation

- Docker created a new image.
- No container was created.
- No output ("Hello World!") appeared.

Reason

- `docker build` only follows the Dockerfile instructions to create an image.
- The `CMD` instruction is stored inside the image but is **not executed** during the build.

---

### Experiment CMD 2

Command

```bash
docker run echo-alpine
```

Observation

```
Hello World!
```

Container status

```
Exited (0)
```

Reason

- Docker created a new container from the image.
- The container executed the `CMD`.
- The process (`echo`) finished immediately.
- Since the main process exited, the container exited as well.

---


### Experiment COPY

Command

```bash
docker build -t hello-image .

docker run hello-image
```

Observation

```
Hello from my first Docker image!
```

Container status

```
Exited (0)
```

Reason

  - COPY copies files from the build context into the image while the image is being built.
  - The copied file becomes part of the image.
  - Every container created from this image starts with the same file.

---


### Experiment RUN

Command

```bash
docker build -t run-demo .

docker run run-demo

docker run run-demo
```

Observation

```
Fri Jul 4 16:15:42 UTC 2026

Fri Jul 4 16:15:42 UTC 2026
(The timestamp remained the same.)

```

Container status

```
Exited (0)
```

Reason

  - RUN executes while building the image.
  - The result of the command becomes part of the image.
  - Every new container starts from that already-built image.
  - Since the image never changed, every container prints the same timestamp.

---


## Realizations

- A Dockerfile is a recipe for creating an image.
- `docker build` creates an image, **not a container**.
- `docker run` creates and starts a container from an image.
- A Dockerfile does not have a name.
- The image receives its name during build.

- Every `docker run` creates a new container unless an existing one is explicitly started.
- Containers still follow the same lifecycle rule:
  - The container stays alive only while its main process is running.
- Images are immutable templates.
- Containers are runnable instances of those images.

- COPY adds files into the image during the build process.
- Files inside an image become the initial filesystem for every new container.
- Containers have their own writable layer on top of the image.
- Creating, modifying, or deleting files inside a container affects only that container.
- The underlying image never changes after it is built.
- Every new container starts with a fresh writable layer.

- RUN executes during `docker build`, not `docker run`.
- RUN is typically used to install software, create files, or prepare the image.
- The result of every RUN instruction becomes part of the built image.
- CMD executes only when a container starts.
- If a value is generated during RUN (e.g. `date`), every container sees the same value until the image is rebuilt.

---

## Commands

```bash
docker build -t <image-name> .

docker images

docker run <image-name>

```