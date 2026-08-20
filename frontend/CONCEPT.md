# API Console — Concept

## Overview

I built a developer-experience tool to reduce friction in API development and testing..

The goal is to make working with an API easier and less repetitive than manually constructing requests in a generic API client. It also it makes the capabilities and workflows of an application visible.

Instead of repeatedly managing URLs, HTTP methods, request bodies, authentication headers, cookies, access tokens, refresh tokens, path parameters, and role-specific endpoints manually, the console provides a structured interface around the API.

The current implementation is built around a specific API, but the underlying concept is intentionally **general-purpose**. It should be usable with any HTTP API as long as the API can provide enough information for the console to understand its routes, parameters, request bodies, authentication requirements, and related metadata.

---

## Why This Exists

While developing an API, repeatedly interacting with it through a generic API client can introduce a lot of development friction.

For example:

- manually selecting and constructing requests
- repeatedly entering request bodies
- copying and attaching access tokens
- managing authentication cookies
- dealing with short-lived access tokens
- manually remembering which endpoints require authentication
- remembering which roles are allowed to access particular endpoints
- repeatedly constructing path parameters
- switching between API documentation and the API client
- maintaining collections of requests separately from the actual API structure

The purpose of API Console is to reduce this friction.

It is intended to make the API itself easier to explore, exercise, and debug while developing.

---

## Core Idea

The console is driven by a structured definition of the API.

A route can be described using metadata such as:

- HTTP method
- path
- route identifier
- group
- description
- authentication requirements
- allowed roles
- path parameters
- request body fields
- additional route-specific behavior

For example:

```ts
{
  id: 'product.create',
  group: 'Product',
  method: 'POST',
  path: '/product',
  summary: 'Create product',
  auth: true,
  roles: ['seller'],
  bodyFields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true
    },
    {
      name: 'price',
      label: 'Price',
      type: 'number',
      required: true,
      min: 0
    }
  ]
}