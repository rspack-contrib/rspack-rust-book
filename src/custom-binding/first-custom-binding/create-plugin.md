# Create a Plugin

In this chapter, we will explore the `MyBannerPlugin` that has already been created in the template as a practical example. While the plugin is already implemented, We will walk you through how to create this plugin from scratch and how to use it in JavaScript. This will demonstrate the complete workflow from Rust implementation to JavaScript integration.

## What is `MyBannerPlugin`?

The `MyBannerPlugin` is a simple plugin that adds a banner comment to the top of generated JavaScript files.

## Prerequisites

Before starting this tutorial, make sure you have completed the [setup process](./setup.md) and can successfully run the example plugin.

## Overview

We will guide you through the plugin creation process in the following steps:

1. **Understand the Plugin Structure** - Examine the basic Rust plugin structure
2. **Learn the Plugin Logic** - Understand how the banner functionality works
3. **NAPI Bindings** - See how Rust functionality is exposed to JavaScript using NAPI-RS
4. **JavaScript Integration** - Learn how to use the plugin in JavaScript and rspack configuration
5. **Testing the Plugin** - Learn how to verify the plugin works correctly

Let's explore the `MyBannerPlugin` implementation!

## 1. Understand the Plugin Structure

The `MyBannerPlugin` is implemented in Rust and follows the standard plugin structure.

- `crates/binding/src/lib.rs` - The glue code that exports the plugin to JavaScript
- `crates/binding/src/plugin.rs` - The `MyBannerPlugin` implementation

## 2. Learn the Plugin Logic

`MyBannerPlugin` is a simple plugin that adds a banner comment to the top of generated `main.js` file.

Before we start, be sure to add the following dependencies to your `Cargo.toml` file:

- `rspack_core` - The Rspack core API
- `rspack_error` - The Rspack error handling API
- `rspack_hook` - The Rspack hook API
- `rspack_sources` - The Rspack source API, which is a port of webpack's [`webpack-sources`](https://github.com/webpack/webpack-sources)

### 2.1. Initialize the Plugin

The `MyBannerPlugin` is implemented as a struct with a `banner` field. The `banner` field is a `String` that contains the banner comment. The `new` method is a constructor that takes a `String` and returns a `MyBannerPlugin` instance.

The `MyBannerPlugin` struct is annotated with `#[plugin]` to indicate that it is a plugin. The `#[plugin]` macro is provided by the `rspack_hook` crate.

It also implements the `Plugin` trait, which is provided by the `rspack_core` crate. The `Plugin` trait is a core trait for all plugins. It requires the `name` method to return the name of the plugin, and the `apply` method to apply the plugin to the compilation, which is just the same as the `apply` method in the [Rspack JavaScript Plugin API](https://rspack.rs/api/plugin-api).

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

### 2.2 Implement with Rust hooks

Just like hooks in the [Rspack JavaScript Plugin API](https://rspack.rs/api/plugin-api), hooks in Rust are implemented as a function that takes a reference to the plugin instance and a reference to the certain categories.

The `apply` method is called with a `PluginContext` instance and a `CompilerOptions` instance.

In this example, we will append the `banner` to the `main.js` file. So we need to implement the `process_assets` hook.

To tap the `process_assets` hook, we need to declare a function and annotate it with `#[plugin_hook]` which is provided by `rspack_hook`. And the `process_assets` is a compilation hook. That means we need to import the hook `CompilationProcessAssets` from `rspack_core`. Set stage to [`Compilation::PROCESS_ASSETS_STAGE_ADDITIONS`](https://rspack.rs/api/plugin-api/compilation-hooks#process-assets-stages) and tracing to `false` to avoid recording the [tracing](https://rspack.rs/contribute/development/tracing#tracing) information as we don't need it in this example.

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

### 2.4 Conclusion

In this section, we have learned how to create a plugin in Rust and how to tap the `process_assets` hook. You can find the full code in the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template/blob/main/crates/binding/src/plugin.rs) repository.

In the next section, we will learn how to expose the plugin to JavaScript.

## 3. NAPI Bindings

In this section, we will learn how to expose the plugin to JavaScript using NAPI bindings. And then we will create a JavaScript wrapper for the plugin. Also reuse the `@rspack/core` package to create a new core package to replace the original `@rspack/core` package.

### 3.1 Expose the plugin to JavaScript

To expose the plugin to JavaScript, we need to create a NAPI binding.

Now it's time to unveil the mystery of the `crates/binding/src/lib.rs` file.

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

As expected, when JavaScript calls `new rspack.MyBannerPlugin("// banner")`, the resolver function receives the banner string. It extracts this string using [`napi::Unknown::coerce_to_string`](https://docs.rs/napi/latest/napi/struct.Unknown.html#method.coerce_to_string) and creates a `BoxPlugin` by calling `MyBannerPlugin::new(banner)`.

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

After the plugin is exposed to JavaScript, we can rerun `pnpm build` in `crates/binding` to build the plugin. Make sure you have `lib.crate-type = ["cdylib"]` defined in your `Cargo.toml` file.

> **Note:** The `cdylib` crate type is required for the plugin to be used in JavaScript.
>
> This makes this crate a dynamic library, on Linux, it will be a `*.so` file and on Windows, it will be a `*.dll` file.
>
> The `NAPI-RS`cli we triggered on `pnpm build` will rename the `*.so` or `*.dll` file to `*.node` file. So that can be loaded by the NAPI runtime, which, in this case, is the Node.js.

### 3.2 Create a JavaScript Plugin wrapper

Now that we have the Rust plugin implemented and exposed to JavaScript, we need to create a JavaScript wrapper for it. So that we can use the plugin in JavaScript and rspack configuration.

Check out the `lib/index.js` file in the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template/blob/main/lib/index.js) repository.

Here we will create a `MyBannerPlugin` class that is a wrapper for the Rust plugin:

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

Let's break down the code:

**1. Rewrite the `RSPACK_BINDING` environment variable**

The `RSPACK_BINDING` environment variable is used to tell the `@rspack/core` package where to load the binding from. The expected value is an **absolute path** of the directory of the binding package.

> **Note:** This line should be placed before the `require('@rspack/core')` line. Otherwise, the `@rspack/core` package will not be able to find the binding.

In this example, we use the `require.resolve` method to get the path of the `@rspack-template/test-binding` package. This resolves to the `index.js` file in the `@rspack-template/test-binding` package. And then use the `dirname` method to get the directory of the `@rspack-template/test-binding` package.

```js,ignore
process.env.RSPACK_BINDING = require('node:path').dirname(
  require.resolve('@rspack-template/test-binding')
);
```

**2. Register the plugin to the global plugin list**

The `register_plugin` macro used in the `crates/binding/src/lib.rs` file exposes the plugin to JavaScript.

For plugin name `MyBannerPlugin` defined in the `crates/binding/src/lib.rs` file, the `register_plugin` macro will expose a JS function named `registerMyBannerPlugin` to the JavaScript side. You have to call this function to register the plugin to the global plugin list.

> **Note:** Calling `registerMyBannerPlugin` does not mean the plugin is registered to the current Rspack instance. It only means the plugin is registered to the global plugin list. You will need to use the wrapper defined in the later section to register the plugin to the current Rspack instance or use it in the rspack configuration.

```js,ignore
const binding = require('@rspack-template/test-binding');

// Register the plugin `MyBannerPlugin` exported by `crates/binding/src/lib.rs`.
binding.registerMyBannerPlugin();
```

**3. Create a wrapper for the plugin**

The `createNativePlugin` function is a function that creates a wrapper for the plugin. It is defined in the `@rspack/core` package.

The first argument to `createNativePlugin` is the name of the plugin defined on the Rust side. The second argument is a resolver function.

In this example, The name of the plugin is `"MyBannerPlugin"`, and the resolver function is called with the options passed to the `new MyBannerPlugin` constructor, which is the banner string. As we don't need to do anything with the options in this example, we just return the options.

```js,ignore
const core = require('@rspack/core');

const MyBannerPlugin = core.experiments.createNativePlugin(
  'MyBannerPlugin',
  function (options) {
    return options;
  }
);
```

**4. Export the plugin wrapper and `@rspack/core`**

Finally, we export the `MyBannerPlugin` wrapper and the `@rspack/core` package. This allows us to use the plugin in the rspack configuration and reuse all the other APIs in the `@rspack/core` package.

```js,ignore
Object.defineProperty(core, 'MyBannerPlugin', {
  value: MyBannerPlugin,
});

module.exports = core;
```

### 3.3 Conclusion

In this section, we have learned how to expose the plugin to JavaScript using NAPI bindings. And then we have created a JavaScript wrapper for the plugin. Also reuse the `@rspack/core` package to create a new core package to replace the original `@rspack/core` package.

In the next section, we will learn how to use the plugin in the rspack configuration.

## 4. JavaScript Integration

In this section, we will learn how to use the `MyBannerPlugin` in the rspack configuration.

Check out the `examples/use-plugin/build.js` file in the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template/blob/main/examples/use-plugin/build.js) repository. We've already created the `MyBannerPlugin` wrapper in the previous section. So we can use it in the rspack configuration.

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

You can now run `node examples/use-plugin/build.js` to see the plugin in action. Check out the output in the `dist/main.js`, and you will see the banner comment added to the top of the file:

```js,ignore
/** Generated by MyBannerPlugin in `@rspack-template/binding` */(() => { // webpackBootstrap
var __webpack_modules__ = ({
"./src/index.js":
...
```

This is also the same command as the [Verify Setup](./setup.md). But now you have the knowledge of what is happening behind the scene.

## Next Steps

In this chapter, we have learned:

- To create a plugin in Rust and how to expose it to JavaScript using NAPI bindings.
- To create a JavaScript wrapper for the plugin.
- To reuse the `@rspack/core` package to create a new core package to replace the original `@rspack/core` package.
- To use the plugin in the rspack configuration.

In the next chapter, we will learn to [release](./release.md) the plugin to npm with [Github Actions](https://docs.github.com/actions).
