# Create a Plugin

In this chapter, we will explore the `MyBannerPlugin` that has already been created in the template as a practical example. While the plugin is already implemented, We will walk you through how to create this plugin from scratch and how to use it in JavaScript. This will demonstrate the complete workflow from Rust implementation to JavaScript integration.

## What is MyBannerPlugin?

The `MyBannerPlugin` is a simple plugin that adds a banner comment to the top of generated JavaScript files. This example will help you understand:

- How to define a plugin in Rust
- How to expose Rust functionality to JavaScript
- How to integrate with rspack's plugin system
- How to handle JavaScript-Rust data exchange

## Prerequisites

Before starting this tutorial, make sure you have completed the [setup process](./setup.md) and can successfully run the example plugin.

## Overview

We will guide you through the plugin creation process in the following steps:

1. **Understand the Plugin Structure** - Examine the basic Rust plugin structure
2. **Learn the Plugin Logic** - Understand how the banner functionality works
3. **JavaScript Bindings** - See how Rust functionality is exposed to JavaScript using NAPI-RS
4. **Testing the Plugin** - Learn how to verify the plugin works correctly
5. **JavaScript Integration** - Discover how to use the plugin in JavaScript and rspack configuration

Let's explore the `MyBannerPlugin` implementation!
