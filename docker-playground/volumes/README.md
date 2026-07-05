# Lesson 02 - Volumes

## Goal

Understand where container data lives and how Docker persists it.

---

## Experiments

### Experiment 1 - Container filesystem

Command:
docker exec ...

Observation:
- Created a table, inserted data.
- Stopped the container.
- Started the same container.
- Table still existed.

Reason:
Stopping only pauses the container.
Its writable filesystem remains.

---

### Experiment 2 - Remove container

Command:
docker rm ...

Observation:
- Removed container.
- Created a new one.
- Data disappeared.

Reason:
The writable filesystem belongs to the container.
Deleting the container deletes that filesystem.

---

### Experiment 3 - Named volume

Command:
docker compose up

Observation:
- Created table, inserted data.
- Removed container.
- Started again.
- Table still existed.

Reason:
Database files were stored in the named volume instead of inside the container.

---

## Realizations

- Containers have their own writable filesystem.
- Stopping a container preserves its filesystem.
- Removing a container deletes its writable filesystem.
- Named volumes live outside the container.
- Removing a container does not remove named volumes.
- Docker Compose prefixes resource names with the project name to avoid conflicts.(volumes_postgres_data)
- Bind mounts map a folder from the host directly into the container.
- Named volumes are typically used for persistent application data (e.g. databases).
- Bind mounts are typically used during development to share source code or configuration files with a container (nginx).

### Other Types of Docker Mounts

- tmpfs mounts
  - Store temporary files in RAM (not on disk).
  - Data is deleted when the container stops.
  - Useful for caches, temporary processing files, and sensitive data.

- Read-only mounts (`:ro`)
  - Allow the container to read files but not modify them.
  - Commonly used for configuration files, SSL certificates, and static assets.

- Mount propagation
  - Controls whether mount changes made inside the container are visible on the host (or vice versa).
  - Mostly used in advanced scenarios involving nested mounts.
  - Options include `shared`, `slave`, and `private`.

- Mount options
  - `:ro` → Read-only access.
  - `:rw` → Read-write access (default).
  - `:cached` → Prioritizes host-side performance (mainly on Docker Desktop/macOS).
  - `:delegated` → Prioritizes container-side performance (Docker Desktop/macOS).