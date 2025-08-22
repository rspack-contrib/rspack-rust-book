# Create a Plugin

This chapter explores the `MyBannerPlugin` that's already created in the template as a practical example. While the plugin is already implemented, we'll walk you through creating this plugin from scratch and using it in JavaScript. This demonstrates the complete workflow from Rust implementation to JavaScript integration.

## What is `MyBannerPlugin`?

`MyBannerPlugin` is a simple plugin that adds a banner comment to the top of generated JavaScript files.

## Prerequisites

Before starting this tutorial, make sure you have completed the [setup process](./setup.md) and can successfully run the example plugin.

## Overview

We'll guide you through the plugin creation process in these steps:

1. **Understand the Plugin Structure** - Examine the basic Rust plugin structure
2. **Learn the Plugin Logic** - Understand how the banner functionality works
3. **NAPI Bindings** - See how Rust functionality is exposed to JavaScript using NAPI-RS
4. **JavaScript Integration** - Learn how to use the plugin in JavaScript and rspack configuration
5. **Testing the Plugin** - Learn how to verify the plugin works correctly

Let's explore the `MyBannerPlugin` implementation.

## 1. Understand the Plugin Structure

The `MyBannerPlugin` is implemented in Rust and follows the standard plugin structure.

- `crates/binding/src/lib.rs` - The glue code that exports the plugin to JavaScript
- `crates/binding/src/plugin.rs` - The `MyBannerPlugin` implementation

## 2. Learn the Plugin Logic

`MyBannerPlugin` adds a banner comment to the top of the generated `main.js` file.

Before we start, be sure to add the following dependencies to your `Cargo.toml` file:

- `rspack_core` - The Rspack core API
- `rspack_error` - The Rspack error handling API
- `rspack_hook` - The Rspack hook API
- `rspack_sources` - The Rspack source API, which is a port of webpack's [`webpack-sources`](https://github.com/webpack/webpack-sources)

### 2.1 Initialize the Plugin

`MyBannerPlugin` is implemented as a struct with a `banner` field containing the banner comment. The `new` method is a constructor that takes a `String` and returns a `MyBannerPlugin` instance.

The `MyBannerPlugin` struct is annotated with `#[plugin]` to indicate it's a plugin. The `#[plugin]` macro is provided by the `rspack_hook` crate.

It also implements the `Plugin` trait from the `rspack_core` crate. The `Plugin` trait is core for all plugins, requiring the `name` method to return the plugin name and the `apply` method to apply the plugin to compilation, matching the `apply` method in the [Rspack JavaScript Plugin API](https://rspack.rs/api/plugin-api).

In this example, the `name` method returns `"MyBannerPlugin"`, and the `apply` method is currently to be implemented.

```rust,ignore
/// A plugin that adds a banner to the output `main.js`.
#[derive(Debug)]
#[plugin]
pub struct MyBannerPlugin {
  banner: String,
}

impl MyBannerPlugin {
  pub fn new(banner: String) -> Self {
    Self::new_inner(banner)
  }
}

impl Plugin for MyBannerPlugin {
  fn name(&self) -> &'static str {
    "MyBannerPlugin"
  }

  fn apply(
    &self,
    ctx: PluginContext<&mut ApplyContext>,
    _options: &CompilerOptions,
  ) -> rspack_error::Result<()> {
    Ok(())
  }
}
```

### 2.2 Implement with Rust Hooks

Like hooks in the [Rspack JavaScript Plugin API](https://rspack.rs/api/plugin-api), Rust hooks are implemented as functions that take a reference to the plugin instance and a reference to certain categories.

The `apply` method is called with `PluginContext` and `CompilerOptions` instances.

In this example, we'll append the `banner` to the `main.js` file, so we need to implement the `process_assets` hook.

To tap the `process_assets` hook, declare a function and annotate it with `#[plugin_hook]` from `rspack_hook`. Since `process_assets` is a compilation hook, import `CompilationProcessAssets` from `rspack_core`. Set the stage to [`Compilation::PROCESS_ASSETS_STAGE_ADDITIONS`](https://rspack.rs/api/plugin-api/compilation-hooks#process-assets-stages) and tracing to `false` to avoid recording [tracing](https://rspack.rs/contribute/development/tracing#tracing) information since we don't need it.

```rust,ignore
#[plugin_hook(CompilationProcessAssets for MyBannerPlugin, stage = Compilation::PROCESS_ASSETS_STAGE_ADDITIONS, tracing = false)]
async fn process_assets(&self, compilation: &mut Compilation) -> Result<()> {
  let asset = compilation.assets_mut().get_mut("main.js");
  if let Some(asset) = asset {
    let original_source = asset.get_source().cloned();
    asset.set_source(Some(Arc::new(ConcatSource::new([
      RawSource::from(self.banner.as_str()).boxed(),
      original_source.unwrap().boxed(),
    ]))));
  }

  Ok(())
}
```

### 2.3 Tap the hook

```rust,ignore
impl Plugin for MyBannerPlugin {
  fn name(&self) -> &'static str {
    "MyBannerPlugin"
  }

  fn apply(
    &self,
    ctx: PluginContext<&mut ApplyContext>,
    _options: &CompilerOptions,
  ) -> rspack_error::Result<()> {
    ctx
      .context
      .compilation_hooks
      .process_assets
      .tap(process_assets::new(self));
    Ok(())
  }
}
```

### 2.3 Conclusion

You've learned how to create a plugin in Rust and tap the `process_assets` hook. Find the full code in the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template/blob/main/crates/binding/src/plugin.rs) repository.

Next, you'll learn how to expose the plugin to JavaScript.

## 3. NAPI Bindings

This section covers exposing the plugin to JavaScript using NAPI bindings, creating a JavaScript wrapper for the plugin, and reusing the `@rspack/core` package to create a new core package replacing the original `@rspack/core` package.

### 3.1 Expose the Plugin to JavaScript

To expose the plugin to JavaScript, create a NAPI binding.

Let's examine the `crates/binding/src/lib.rs` file.

Add these dependencies to your `Cargo.toml`:

- `rspack_binding_builder` - Rspack binding builder API
- `rspack_binding_builder_macros` - Rspack binding builder macros
- [`napi`](https://docs.rs/napi/latest/napi/) - NAPI-RS crate
- [`napi_derive`](https://docs.rs/napi_derive/latest/napi_derive/) - NAPI-RS derive macro

The `crates/binding/src/lib.rs` file exports the plugin to JavaScript using NAPI bindings.

> **Note:** Split plugin implementation across files: `plugin.rs` for logic, `lib.rs` for JavaScript bindings.

Import required crates and use the `register_plugin` macro to expose the plugin:

1. Import `napi::bindgen_prelude::*` (required by `register_plugin` macro)
2. Import `register_plugin` from `rspack_binding_builder_macros`
3. Import `napi_derive` with `#[macro_use]` attribute
4. Use `register_plugin` with a plugin name and resolver function

The `register_plugin` macro takes a plugin name (used for JavaScript identification) and a resolver function. The resolver receives [`napi::Env`](https://docs.rs/napi/latest/napi/struct.Env.html) and [`napi::Unknown`](https://docs.rs/napi/latest/napi/struct.Unknown.html) options from JavaScript, returning a `BoxPlugin` instance.

When JavaScript calls `new rspack.MyBannerPlugin("// banner")`, the resolver function receives the banner string. It extracts this string using [`napi::Unknown::coerce_to_string`](https://docs.rs/napi/latest/napi/struct.Unknown.html#method.coerce_to_string) and creates a `BoxPlugin` by calling `MyBannerPlugin::new(banner)`.

> **Note:** The `Unknown` type represents any JavaScript value.
>
> In this example, we use the `coerce_to_string` method to get the banner string. The `coerce_to_string` method returns a `Result` - it will succeed for [string-convertible values](https://nodejs.org/api/n-api.html#napi_coerce_to_string) but error if the value cannot be converted to a string. Additional type validation can be added as needed.

```rust,ignore
mod plugin;

use napi::bindgen_prelude::*;
use rspack_binding_builder_macros::register_plugin;
use rspack_core::BoxPlugin;

#[macro_use]
extern crate napi_derive;
extern crate rspack_binding_builder;

// Export a plugin named `MyBannerPlugin`.
//
// `register_plugin` is a macro that registers a plugin.
//
// The first argument to `register_plugin` is the name of the plugin.
// The second argument to `register_plugin` is a resolver function that is called with `napi::Env` and the options returned from the resolver function from JS side.
//
// The resolver function should return a `BoxPlugin` instance.
register_plugin!("MyBannerPlugin", |_env: Env, options: Unknown<'_>| {
  let banner = options
    .coerce_to_string()?
    .into_utf8()?
    .as_str()?
    .to_string();
  Ok(Box::new(plugin::MyBannerPlugin::new(banner)) as BoxPlugin)
});
```

After exposing the plugin to JavaScript, rerun `pnpm build` in `crates/binding` to build the plugin. Ensure you have `lib.crate-type = ["cdylib"]` defined in your `Cargo.toml` file.

> **Note:** The `cdylib` crate type is required for the plugin to be used in JavaScript.
>
> This makes this crate a dynamic library, on Linux, it will be a `*.so` file and on Windows, it will be a `*.dll` file.
>
> The `NAPI-RS`cli we triggered on `pnpm build` will rename the `*.so` or `*.dll` file to `*.node` file. So that can be loaded by the NAPI runtime, which, in this case, is the Node.js.

### 3.2 Create a JavaScript Plugin Wrapper

With the Rust plugin implemented and exposed to JavaScript, create a JavaScript wrapper to use the plugin in JavaScript and Rspack configuration.

Check the `lib/index.js` file in the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template/blob/main/lib/index.js) repository.

Create a `MyBannerPlugin` class that wraps the Rust plugin:

````js,ignore
// Rewrite the `RSPACK_BINDING` environment variable to the directory of the `.node` file.
// So that we can reuse the `@rspack/core` package to load the right binding.
process.env.RSPACK_BINDING = require('node:path').dirname(
  require.resolve('@rspack-template/test-binding')
);

const binding = require('@rspack-template/test-binding');

// Register the plugin `MyBannerPlugin` exported by `crates/binding/src/lib.rs`.
binding.registerMyBannerPlugin();

const core = require('@rspack/core');

/**
 * Creates a wrapper for the plugin `MyBannerPlugin` exported by `crates/binding/src/lib.rs`.
 *
 * Check out `crates/binding/src/lib.rs` for the original plugin definition.
 * This plugin is used in `examples/use-plugin/build.js`.
 *
 * @example
 * ```js
 * const MyBannerPlugin = require('@rspack-template/test-core').MyBannerPlugin;
 * ```
 *
 * `createNativePlugin` is a function that creates a wrapper for the plugin.
 *
 * The first argument to `createNativePlugin` is the name of the plugin.
 * The second argument to `createNativePlugin` is a resolver function.
 *
 * Options used to call `new MyBannerPlugin` will be passed as the arguments to the resolver function.
 * The return value of the resolver function will be used to initialize the plugin in `MyBannerPlugin` on the Rust side.
 *
 * For the following code:
 *
 * ```js
 * new MyBannerPlugin('// Hello World')
 * ```
 *
 * The resolver function will be called with `'// Hello World'`.
 *
 */
const MyBannerPlugin = core.experiments.createNativePlugin(
  'MyBannerPlugin',
  function (options) {
    return options;
  }
);

Object.defineProperty(core, 'MyBannerPlugin', {
  value: MyBannerPlugin,
});

module.exports = core;
````

Breaking down the code:

**1. Rewrite the `RSPACK_BINDING` Environment Variable**

The `RSPACK_BINDING` environment variable tells the `@rspack/core` package where to load the binding from. The expected value is an **absolute path** to the binding package directory.

> **Note:** This line should be placed before the `require('@rspack/core')` line. Otherwise, the `@rspack/core` package will not be able to find the binding.

This example uses `require.resolve` to get the path of the `@rspack-template/test-binding` package. This resolves to the `index.js` file in the `@rspack-template/test-binding` package, then uses `dirname` to get the package directory.

```js,ignore
process.env.RSPACK_BINDING = require('node:path').dirname(
  require.resolve('@rspack-template/test-binding')
);
```

**2. Register the Plugin to the Global Plugin List**

The `register_plugin` macro in `crates/binding/src/lib.rs` exposes the plugin to JavaScript.

For the `MyBannerPlugin` defined in `crates/binding/src/lib.rs`, the `register_plugin` macro exposes a JS function named `registerMyBannerPlugin`. Call this function to register the plugin to the global plugin list.

> **Note:** Calling `registerMyBannerPlugin` doesn't register the plugin to the current Rspack instance. It only registers the plugin to the global plugin list. Use the wrapper defined in the next section to register the plugin to the current Rspack instance or use it in Rspack configuration.

```js,ignore
const binding = require('@rspack-template/test-binding');

// Register the plugin `MyBannerPlugin` exported by `crates/binding/src/lib.rs`.
binding.registerMyBannerPlugin();
```

**3. Create a Wrapper for the Plugin**

The `createNativePlugin` function creates a wrapper for the plugin. It's defined in the `@rspack/core` package.

The first argument to `createNativePlugin` is the plugin name defined on the Rust side. The second argument is a resolver function.

In this example, the plugin name is `"MyBannerPlugin"`, and the resolver function is called with options passed to the `new MyBannerPlugin` constructor (the banner string). Since we don't need to process the options, we just return them.

```js,ignore
const core = require('@rspack/core');

const MyBannerPlugin = core.experiments.createNativePlugin(
  'MyBannerPlugin',
  function (options) {
    return options;
  }
);
```

**4. Export the Plugin Wrapper and `@rspack/core`**

Finally, export the `MyBannerPlugin` wrapper and the `@rspack/core` package. This allows using the plugin in Rspack configuration and reusing all other APIs in the `@rspack/core` package.

```js,ignore
Object.defineProperty(core, 'MyBannerPlugin', {
  value: MyBannerPlugin,
});

module.exports = core;
```

### 3.3 Conclusion

You've learned how to expose the plugin to JavaScript using NAPI bindings, created a JavaScript wrapper for the plugin, and reused the `@rspack/core` package to create a new core package replacing the original `@rspack/core` package.

Next, you'll learn how to use the plugin in Rspack configuration.

## 4. JavaScript Integration

This section covers using the `MyBannerPlugin` in Rspack configuration.

Check the `examples/use-plugin/build.js` file in the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template/blob/main/examples/use-plugin/build.js) repository. With the `MyBannerPlugin` wrapper created in the previous section, you can now use it in Rspack configuration.

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
    new rspack.MyBannerPlugin(
      '/** Generated by MyBannerPlugin in `@rspack-template/binding` */'
    ),
  ],
});

compiler.run((err, stats) => {
  if (err) {
    console.error(err);
  }
  console.info(stats.toString({ colors: true }));
});
```

## 5. Testing the Plugin

Run `node examples/use-plugin/build.js` to see the plugin in action. Check the output in `dist/main.js` to see the banner comment added to the top of the file:

```js,ignore
/** Generated by MyBannerPlugin in `@rspack-template/binding` */(() => { // webpackBootstrap
var __webpack_modules__ = ({
"./src/index.js":
...
```

This is the same command as in [Verify Setup](./setup.md), but now you understand what's happening behind the scenes.

## Summary

You've learned how to:

- Create a plugin in Rust and expose it to JavaScript using NAPI bindings
- Create a JavaScript wrapper for the plugin
- Reuse the `@rspack/core` package to create a new core package replacing the original `@rspack/core` package
- Use the plugin in Rspack configuration

Next, you'll learn to [release](./release.md) the plugin to npm with [GitHub Actions](https://docs.github.com/actions).
