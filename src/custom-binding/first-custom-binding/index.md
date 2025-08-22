# First Custom Binding

This chapter will guide you through creating your first custom Rspack binding, from initial setup to publishing on npm.

You'll learn to build a complete `MyBannerPlugin` that adds custom banners to generated JavaScript files, demonstrating the full workflow from Rust implementation to JavaScript integration.

## What You'll Build

By the end of this chapter, you'll have:

- A working Rust plugin that integrates with Rspack's compilation process
- NAPI bindings that expose your Rust code to JavaScript  
- A complete npm package ready for distribution
- Understanding of the Rspack plugin architecture

## Prerequisites

- [Create From Template](../getting-started/create-from-template.md)

## Chapter Overview

1. **[Setup](./setup.md)** - Configure your development environment
2. **[Create a Plugin](./create-plugin.md)** - Build the MyBannerPlugin from scratch
3. **[Release](./release.md)** - Publish your plugin to npm with GitHub Actions
