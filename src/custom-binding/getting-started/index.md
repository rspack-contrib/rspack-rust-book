# Getting Started

Welcome to _Rspack Custom Binding_! This guide will help you get started with creating your own native _Node.js addon_ for Rspack.

> **⚠️ Experimental Stage**: Rspack Custom Binding is currently in experimental stage. Rust APIs are likely to change in the future as the ecosystem evolves. JavaScript APIs follow semantic versioning (semver), but Rust crate versions do not follow semver due to the [version mapping strategy](../references/bump-rspack-version.md#version-mapping-strategy).

## Prerequisites

Before diving into _Rspack Custom Binding_, we recommend:

1. **Read the [Rationale](./rationale.md)** - Understand why you might want to use custom bindings and how they work
2. **Basic Rust Knowledge** - Familiarity with [Rust programming language](https://www.rust-lang.org/learn)
3. **Node.js Experience** - Understanding of [Node.js addons](https://nodejs.org/api/addons.html) and [N-API](https://nodejs.org/api/n-api.html) concepts

If you are not familiar with writing _Node.js addons_ and _N-API_ in Rust, don't worry. We will cover the basics in the guide.

## Next Steps

Once you understand the rationale and architecture, proceed to the [Create From Template](./create-from-template.md) guide to set up your development environment.
