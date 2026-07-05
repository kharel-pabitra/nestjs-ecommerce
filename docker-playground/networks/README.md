# Lesson 03 - Networks

## Goal

Understand how containers communicate with each other and how Docker networking works.

---

## Experiments

### Experiment 1

Compose file:

- app
- postgres

Question:

- How many containers?
- How many networks?
- Can app find postgres?

Observation:

- Docker Compose created one network automatically.
- Both containers joined the same network.
- The app container successfully pinged `postgres`.

Reason:

- Docker Compose creates a private bridge network for every project.
- Every service automatically joins that network.
- Docker provides an internal DNS server so services can reach each other by service name.

---

### Experiment 2

Command:

```sh
docker exec -it networks-app-1 sh

ping localhost
```

Observation:

- localhost resolved successfully.
- It pointed back to the same container.

Reason:

- Inside a container, localhost always means "this container", not the Docker host and not another container.

---

### Experiment 3

Command:

```sh
ping ecommerce-db
```

Observation:

- Failed with "bad address".

Reason:

- Docker DNS only knows containers that belong to the same network.
- `ecommerce-db` belongs to another Docker network.

---

### Experiment 4

Command:

```sh
ping 172.19.0.2
```

Observation:

- 100% packet loss.

Reason:

- Different Docker bridge networks are isolated.
- Knowing another container's IP does not automatically make it reachable.

---

### Experiment 5

Command:

```sh
docker network connect networks_default ecommerce-db
```

Then

```sh
ping ecommerce-db
```

Observation:

- Ping now succeeded.

Reason:

- The same container was attached to a second network.
- Docker assigned it a second IP address on that network.
- Docker DNS now resolved `ecommerce-db` to the IP belonging to the current network.
- Because "container receives one IP address per network it joins" , after connecting the `ping 172.22.0.4` also succeeds. This is ip address of the container in this network.

---

## Realizations

- Docker Compose assumes all services in one compose file belong to the same application.
- Docker Compose automatically creates a bridge network named `<project>_default`.
- Every service automatically joins that network unless configured otherwise.
- Docker runs an internal DNS server for every network.
- Containers can communicate using service names instead of IP addresses.
- `localhost` inside a container always refers to that container itself.
- Different Docker networks are isolated from each other by default.
- A container may belong to multiple Docker networks.
- A container receives one IP address per network it joins.
- Docker DNS resolves a service name to the IP address belonging to the current network.
- Networks themselves are not connected together; containers are attached to one or more networks.

- Host-to-container communication uses published ports (`ports:`).
- Container-to-container communication uses Docker networks and service names.

## Commands

```sh
docker network ls

docker network inspect <network>

docker network connect <network> <container>

docker exec -it <container> sh

ping <service-name>

ping localhost

ping <ip-address>
```