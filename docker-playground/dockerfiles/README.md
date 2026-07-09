# Lesson 04 - Dockerfiles

## Goal

Understand what a Dockerfile actually is and how it differs from a running container.

---

## Experiments

### Experiment 1

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

### Experiment 2

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

---

## Commands

```bash
docker build -t <image-name> .

docker images

docker run <image-name>

```