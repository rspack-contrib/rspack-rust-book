# Create from Template

To create a new repository based on the template, click the button below.

<a href="https://github.com/new?template_name=rspack-binding-template&template_owner=rspack-contrib">
  <img src="../../images/deploy-from-template.svg" alt="Deploy from Template" />
</a>

Or visit the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template) repository and click **"Use this template"**.

After creating your repository, the binding will automatically start building. You can check the compilation progress in the **Actions** page of your new repository.

The initial commit will trigger a comprehensive CI workflow that includes:

- **Cargo Check** - Rust code validation
- **Cargo Clippy** - Linting and best practices
- **Build** - Cross-platform compilation for multiple targets:
  - macOS (x86_64 and ARM64)
  - Windows (x86_64, i686, and ARM64)
  - Linux (x86_64 GNU/musl, ARM64 GNU/musl, ARMv7)
  - Android (ARM64 and ARMv7)
- **Test** - Running tests on Ubuntu, macOS, and Windows

A successful run typically takes around 20 minutes and generates platform-specific binary artifacts. You can see an example of a completed workflow [here](https://github.com/h-a-n-a/my-rspack-binding/actions/runs/16494161817).

> **Note:** You don't need to check 'include all branches'.

## Template Structure

- **`crates/binding/`** - Rust binding implementation
- **`examples/use-plugin/`** - Plugin examples
- **`lib/`** - JavaScript/TypeScript interface code
- **`Cargo.toml`**, **`package.json`** - Package configurations
- **`.github/`**, **`.cargo/`** - CI/CD and tooling setup

**Tech Stack:** Rust, JavaScript/TypeScript, Node.js, Cargo, pnpm, GitHub Actions

## Next Steps

In this chapter, we have learned:

- To create a new repository based on the template.

In the next chapter, we will learn how to [setup the repository locally](./setup.md).
