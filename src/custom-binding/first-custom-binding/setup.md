# Setup

This section guides you through setting up your newly created rspack-binding repository for local development.

## Prerequisites

Ensure you have the following installed:

- **Node.js** (>= 18.0.0)
- **Rust** (latest stable version)

This repository uses [Corepack](https://github.com/nodejs/corepack) to manage package managers, eliminating the need to install pnpm manually.

> **Note:** According to the [official documentation](https://github.com/nodejs/corepack?tab=readme-ov-file#manual-installs): "Corepack is distributed with Node.js from version 14.19.0 up to (but not including) 25.0.0. Run `corepack enable` to install the required Yarn and pnpm binaries on your path."
>
> If you're using Node.js 25+ or an older version, you may need to install Corepack manually following the [installation guide](https://github.com/nodejs/corepack?tab=readme-ov-file#manual-installs).

## Installation Steps

### 1. Clone your repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Enable Corepack

```bash
corepack enable
```

### 3. Install dependencies

```bash
pnpm install
```

This command reads the `pnpm-workspace.yaml` configuration and installs dependencies for all workspace projects, including `@rspack-template/binding` and `@rspack-template/core`.

> **Note:** The package names `@rspack-template/binding` and `@rspack-template/core` are demo names used to make the template runnable. Their functionalities correspond to `@rspack/binding` and `@rspack/core` respectively. You can manually replace these package names with your own.
>
> We recommend using npm scope for your package names. As mentioned in the [NAPI-RS documentation](https://napi.rs/docs/introduction/getting-started#deep-dive): "It is recommended to distribute your package under npm scope because `@napi-rs/cli` will, by default, append different platform suffixes to the npm package name for different platform binary distributions. Using npm scope will help reduce the chance that the package name was already taken."

You should see output similar to this:

```text
❯ pnpm install
Scope: all 3 workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +126
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 126, reused 123, downloaded 3, added 126, done

dependencies:
+ @rspack-template/binding 0.0.2 <- crates/binding
+ @rspack/core 1.4.10

devDependencies:
+ @taplo/cli 0.7.0
+ husky 9.1.7
+ lint-staged 16.1.2

. prepare$ husky
└─ Done in 97ms
Downloading @rspack/binding-darwin-arm64@1.4.10: 17.67 MB/17.67 MB, done
Done in 4.1s using pnpm v10.13.1
```

> **For the following tutorials:** We use `@rspack-template/test-binding` and `@rspack-template/test-core` as example package names. We'll perform a global replacement of these package names and reinstall dependencies to demonstrate the complete development workflow. See [this commit](https://github.com/h-a-n-a/my-rspack-binding/commit/2ce89d6d3a1e08019458214a7bb1f3eb1720d82b) for reference.

### 4. Build the project

```bash
pnpm build
```

This command triggers [NAPI-RS](https://napi.rs/) compilation to build the Rust binding. NAPI-RS is a framework for building pre-compiled Node.js addons in Rust, providing a safe and efficient way to call Rust code from JavaScript.

You should see output similar to this:

```text
❯ pnpm build

> @rspack-template/test-core@0.0.2 build /my-rspack-binding
> pnpm run --filter @rspack-template/test-binding build


> @rspack-template/test-binding@0.0.2 build /my-rspack-binding/crates/binding
> napi build --platform

   Compiling proc-macro2 v1.0.95
   Compiling unicode-ident v1.0.18
   Compiling serde v1.0.219
   Compiling libc v0.2.174
   Compiling version_check v0.9.5
   Compiling crossbeam-utils v0.8.21
   Compiling rayon-core v1.12.1
   Compiling autocfg v1.5.0
   Compiling zerocopy v0.8.26
   Compiling getrandom v0.3.3
   Compiling object v0.36.7
   Compiling parking_lot_core v0.9.11
   Compiling anyhow v1.0.98
   ...
   Compiling rspack_plugin_hmr v0.4.10
   Compiling rspack_plugin_css_chunking v0.4.10
   Compiling rspack_plugin_module_info_header v0.4.10
   Compiling rspack_plugin_sri v0.4.10
   Compiling rspack_binding_builder v0.4.10
   Compiling rspack_binding_builder_macros v0.4.10
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 3m 29s
```

The build process compiles the Rust code in `crates/binding` into a native Node.js addon (`.node` file) that can be called from JavaScript.

## Verify Setup

To verify that everything is working correctly, run the example plugin:

```bash
node examples/use-plugin/build.js
```

This executes the example plugin using your compiled binding, demonstrating that the Rust-JavaScript integration works properly.

If the example runs successfully, your setup is complete and ready for development:

```text
❯ node examples/use-plugin/build.js
assets by status 1.46 KiB [cached] 1 asset
runtime modules 93 bytes 2 modules
./src/index.js 1 bytes [built] [code generated]
Rspack 1.4.10 compiled successfully in 30 ms
```

## Summary

You've successfully:

- Set up the repository locally
- Built the project using NAPI-RS
- Verified the setup with the example plugin

Next, you'll learn to create the [`MyBannerPlugin`](./create-plugin.md) as a practical example demonstrating how to build custom Rspack bindings. This plugin shows the complete workflow from Rust implementation to JavaScript integration.
