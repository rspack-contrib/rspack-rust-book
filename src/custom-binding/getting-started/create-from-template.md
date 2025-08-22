# Create From Template

## Creating Your Repository

Click the button below to create a new repository from the template:

<a href="https://github.com/new?template_name=rspack-binding-template&template_owner=rspack-contrib">
  <img src="../../images/deploy-from-template.svg" alt="Deploy from Template" />
</a>

Alternatively, visit the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template) repository and click **"Use this template"**.

## Automatic Build

After creating your repository, the binding will automatically start building. Monitor the progress on the **Actions** page of your repository.

### CI Workflow

The initial commit triggers a comprehensive workflow:

- **Cargo Check** - Rust code validation
- **Cargo Clippy** - Linting and best practices
- **Build** - Cross-platform compilation for:
  - macOS (x86_64 and ARM64)
  - Windows (x86_64, i686, and ARM64)
  - Linux (x86_64 GNU/musl, ARM64 GNU/musl, ARMv7)
  - Android (ARM64 and ARMv7)
- **Test** - Running tests on Ubuntu, macOS, and Windows

A successful run takes ~20 minutes and generates platform-specific binary artifacts. See an [example workflow](https://github.com/h-a-n-a/my-rspack-binding/actions/runs/16494161817).

> **Note**: You don't need to check "Include all branches" when creating from the template.

## What You Get

The template provides two key packages that extend Rspack:

- **New Core Package** - Extends `@rspack/core` with your custom functionality
- **New Binding** - Extends `@rspack/binding` (the transitive dependency that `@rspack/core` uses) with your Rust code

These become drop-in replacements for the standard Rspack packages in your projects.

## Template Structure

The template includes these key components:

- **`crates/binding/`** - Your Rust code that extends Rspack's functionality
- **`examples/`** - Ready-to-run examples showing how to use your custom binding
  - **`use-plugin/`** - Demonstrates custom Rust plugin usage
  - **`use-loader/`** - Demonstrates custom Rust loader usage
- **`lib/`** - JavaScript wrapper that becomes your new `@rspack/core` package
- **Configuration files** - Essential setup for building and publishing:
  - **`Cargo.toml`**, **`package.json`** - Package definitions
  - **`rust-toolchain.toml`**, **`rustfmt.toml`** - Consistent Rust environment
  - **`pnpm-workspace.yaml`** - Monorepo workspace management
- **Automation** - Pre-configured tooling:
  - **`.github/`** - CI/CD workflows for cross-platform builds
  - **`.cargo/`** - Rust build configuration
  - **`.husky/`** - Git hooks for code quality

**Tech Stack:** Rust, JavaScript/TypeScript, Node.js, Cargo, pnpm, GitHub Actions

## Next Steps

In this chapter, we learned how to create a new repository based on the template.

In the next chapter, we will learn how to [set up the repository locally](../first-custom-binding/setup.md).
