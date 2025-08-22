# Create a Loader

This chapter explores creating a custom loader for Rspack using the `MyBannerLoader` example. While the loader is already implemented in the template, we'll walk you through creating this loader from scratch and using it in JavaScript. This demonstrates the complete workflow from Rust implementation to JavaScript integration.

## What is `builtin:my-banner-loader`?

`builtin:my-banner-loader` is a simple loader that prepends a configurable banner comment to the top of modules.

## Prerequisites

Before starting this tutorial, ensure you've completed the [setup process](./first-custom-binding/setup.md) and can successfully run the example plugin.

## Overview

We'll guide you through the loader creation process in these steps:

1. **Understand the Loader Structure** - Examine the basic Rust loader structure
2. **Implement the Loader Logic** - Understand how the banner functionality works with async traits and caching
3. **Loader Plugin Integration** - Learn how loaders are registered via plugins (critical step)
4. **NAPI Bindings** - See how both loader and plugin functionality are exposed to JavaScript
5. **JavaScript Integration** - Learn the two-step process: register plugin, then use loader
6. **Testing the Loader** - Learn how to verify the loader works correctly

> **⚠️ Important:** Builtin loaders require plugin registration before they can be used in build configurations.

Let's explore the `MyBannerLoader` implementation.

## 1. Understand the Loader Structure

`MyBannerLoader` is implemented in Rust and follows the standard loader structure with a companion plugin for registration.

- `crates/binding/src/lib.rs` - The glue code that exports both the loader and plugin to JavaScript
- `crates/binding/src/loader.rs` - The `MyBannerLoader` implementation and `MyBannerLoaderPlugin`

## 2. Implement the Loader Logic

`MyBannerLoader` prepends a configurable banner comment to source files during the build process.

Before starting, add these dependencies to your `Cargo.toml` file:

- `rspack_core` - The Rspack core API
- `rspack_error` - The Rspack error handling API
- `rspack_cacheable` - For making loaders cacheable
- `async_trait` - For async trait implementations

### 2.1 Initialize the Loader

`MyBannerLoader` is implemented as a struct with a `banner` field containing the banner comment to prepend.

```rust,ignore
use std::sync::Arc;

use async_trait::async_trait;
use rspack_cacheable::{cacheable, cacheable_dyn, with::AsPreset};
use rspack_core::{
  Context, Loader, LoaderContext, LoaderRunnerContext, Plugin, PluginContext,
  PluginExt,
};
use rspack_error::{internal_error, Result};

#[cacheable]
#[derive(Debug)]
pub struct MyBannerLoader {
  banner: String,
}

impl MyBannerLoader {
  pub fn new(banner: String) -> Self {
    Self { banner }
  }
}
```

### 2.2 Implement the Loader Trait with Async Processing

The loader implements the `Loader` trait using async processing and caching support.

> **Note:** Use `#[rspack_cacheable::cacheable]` to make your loader cacheable, as Rspack binding supports persistent cache for better performance. This ensures unchanged files aren't reprocessed, significantly improving build times.

```rust,ignore
#[rspack_cacheable::cacheable_dyn]
#[async_trait]
impl Loader for MyBannerLoader {
  async fn run(&self, loader_context: &mut LoaderContext<LoaderRunnerContext>) -> Result<()> {
    let source = loader_context.take_content();

    if let Some(source) = source {
      let source = source.try_into_string()?;
      let source = format!("{}\n{}", self.banner, source);
      loader_context.finish_with(source);
    } else {
      loader_context.finish_with_empty();
    }
    Ok(())
  }
}


// Implement the Identifiable trait to provide a unique identifier for the loader
// This identifier is used by Rspack's internal caching system to identify
// and track this specific loader instance
impl rspack_collections::Identifiable for MyBannerLoader {
  fn identifier(&self) -> rspack_collections::Identifier {
    rspack_collections::Identifier::from("builtin:my-banner-loader")
  }
}
```

### 2.3 Conclusion

You've learned how to create a loader in Rust with async support and caching. The loader processes source content by prepending a banner string.

Next, you'll learn how to register this loader through a plugin.

## 3. Loader Plugin Integration

**Critical Step:** Custom loaders must be registered via a plugin before they can be used in build configurations. This is accomplished through a companion plugin.

### 3.1 Create the Loader Plugin

```rust,ignore
#[plugin]
#[derive(Debug)]
pub struct MyBannerLoaderPlugin;

impl MyBannerLoaderPlugin {
  pub fn new() -> Self {
    Self::new_inner()
  }
}

/// Resolves the `builtin:my-banner-loader` loader
#[plugin_hook(NormalModuleFactoryResolveLoader for MyBannerLoaderPlugin, tracing = false)]
pub(crate) async fn resolve_loader(
  &self,
  _context: &rspack_core::Context,
  _resolver: &rspack_core::Resolver,
  loader: &rspack_core::ModuleRuleUseLoader,
) -> Result<Option<rspack_core::BoxLoader>> {
  if loader.loader.starts_with("builtin:my-banner-loader") {
    let banner = loader.options.clone().unwrap_or_default();
    return Ok(Some(Arc::new(MyBannerLoader::new(banner))));
  }

  Ok(None)
}

impl rspack_core::Plugin for MyBannerLoaderPlugin {
  fn apply(&self, ctx: &mut rspack_core::ApplyContext) -> Result<()> {
    ctx
      .normal_module_factory_hooks
      .resolve_loader
      .tap(resolve_loader::new(self));
    Ok(())
  }
}
```

### 3.2 Why Plugin Registration is Required

Loaders must be registered in Rspack's loader resolution system. The `MyBannerLoaderPlugin`:

1. **Registers the loader** with a specific name (`builtin:my-banner-loader`)
2. **Makes it available** for use in build configurations
3. **Integrates with** Rspack's loader resolution mechanism

Without this plugin registration, the loader won't be found when referenced in build configurations.

### 3.3 Conclusion

You've learned that custom loaders require plugin registration. The companion plugin registers the loader in Rspack's resolution system, making it available for use.

Next, you'll learn how to expose both components to JavaScript.

## 4. NAPI Bindings

This section covers exposing both the loader and its registration plugin to JavaScript using NAPI bindings.

### 4.1 Expose Both Components to JavaScript

To use the loader in JavaScript, expose both the loader logic and the registration plugin.

Add these dependencies to your `Cargo.toml`:

- `rspack_binding_builder` - Rspack binding builder API
- `rspack_binding_builder_macros` - Rspack binding builder macros
- [`napi`](https://docs.rs/napi/latest/napi/) - NAPI-RS crate
- [`napi_derive`](https://docs.rs/napi_derive/latest/napi_derive/) - NAPI-RS derive macro

The `crates/binding/src/lib.rs` file exports both components to JavaScript:

```rust,ignore
mod loader;

use napi::bindgen_prelude::*;
use rspack_binding_builder_macros::register_plugin;
use rspack_core::BoxPlugin;

#[macro_use]
extern crate napi_derive;
extern crate rspack_binding_builder;

// Register the loader plugin that makes the loader available
register_plugin!("MyBannerLoaderPlugin", |_env: Env, _options: Unknown<'_>| {
  Ok(Box::new(loader::MyBannerLoaderPlugin::new()) as BoxPlugin)
});
```

### 4.2 Registration Pattern

The `register_plugin` macro creates the JavaScript binding for the plugin that registers our loader. This follows the same pattern as regular plugins but serves the specific purpose of loader registration.

### 4.3 Conclusion

You've exposed the loader registration plugin to JavaScript. This allows registering the loader from JavaScript before using it in build configurations.

## 5. JavaScript Integration

This section covers the two-step process for using custom loaders: register the plugin, then use the loader.

### 5.1 Create JavaScript Plugin Wrapper

First, create a wrapper for the loader registration plugin in your `lib/index.js`:

```js,ignore
// Rewrite the RSPACK_BINDING environment variable
process.env.RSPACK_BINDING = require('node:path').dirname(
  require.resolve('@rspack-template/test-binding')
);

const binding = require('@rspack-template/test-binding');

// Register the loader plugin
binding.registerMyBannerLoaderPlugin();

const core = require('@rspack/core');

// Create wrapper for the loader registration plugin
const MyBannerLoaderPlugin = core.experiments.createNativePlugin(
  'MyBannerLoaderPlugin',
  function (options) {
    return options;
  }
);

// Export the plugin
Object.defineProperty(core, 'MyBannerLoaderPlugin', {
  value: MyBannerLoaderPlugin,
});

module.exports = core;
```

### 5.2 Two-Step Usage Process

**Step 1: Register the Loader Plugin**

In your build configuration, first add the loader registration plugin:

```js,ignore
const path = require('node:path');
const rspack = require('@rspack-template/test-core');

const compiler = rspack({
  context: __dirname,
  mode: 'development',
  entry: {
    main: './src/index.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    // Step 1: Register the loader
    new rspack.MyBannerLoaderPlugin(),
  ],
  // Step 2: Use the loader
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'builtin:my-banner-loader',
            options: '/** Generated by builtin:my-banner-loader */',
          },
        ],
      },
    ],
  },
});
```

**Step 2: Configure the Loader**

Once the plugin is registered, you can use the loader in module rules with the registered name `builtin:my-banner-loader`.

### 5.3 Complete Example

Check the `examples/use-loader/build.js` file in the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template/blob/main/examples/use-loader/build.js) repository for a complete working example.

## 6. Testing the Loader

Run the example to see the loader in action:

```bash
node examples/use-loader/build.js
```

Check the output in the `dist/main.js` file to see the banner comment added to the top of the modules.


## Summary

You've learned how to:

- Create a cacheable loader in Rust with async processing
- Understand the critical importance of plugin registration for custom loaders
- Expose both loader and registration plugin to JavaScript using NAPI bindings
- Follow the two-step process: register plugin first, then use loader
- Configure and test the loader in build configurations

This pattern can be extended to create more complex loaders for various source transformations. The key concepts of plugin registration and cacheable implementation remain consistent across different loader implementations.
