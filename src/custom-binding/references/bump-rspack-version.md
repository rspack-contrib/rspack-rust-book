# Bump Rspack Version

This guide covers how to update Rspack versions in your custom binding project. There are two main approaches: using automated tools like Renovate bot or manually updating version files.

## Version Mapping Strategy

Rspack follows a specific version mapping between Npm packages and Rust crates:

- **Npm packages** (including `@rspack/core`): Use the full semantic version (e.g., `1.5.0`, `1.4.9-alpha.0`)
- **Rust crates**: Use the version without the major version prefix (e.g., `0.5.0`, `0.4.9-alpha.0`)

**Formula**: `crate version = npm major version - 1`

This mapping ensures consistency across the ecosystem. Note that Rust crates are **NOT** following semantic versioning conventions due to the version mapping strategy.

> **Note**: This version mapping only applies to crates released in the rspack repository. Other crates like `rspack-sources` have different versioning strategies.

> **Important**: If the version of `@rspack/core` and Rust crates don't match according to this mapping, Rspack will report an error. See the [binding version check implementation](https://github.com/web-infra-dev/rspack/blob/06bd5ba177ed7d73c6feda7e0619172b77adc797/packages/rspack/src/util/bindingVersionCheck.ts#L9) for details.

### Examples

| Npm Package Version | Rust Crate Version |
|---------------------|-------------------|
| `1.5.0` | `0.5.0` |
| `1.4.9` | `0.4.9` |
| `1.4.9-alpha.0` | `0.4.9-alpha.0` |

For example, in the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template):

- **package.json**: `"@rspack/core": "1.5.0-beta.0"`
- **Cargo.toml**: `rspack_core = { version = "=0.5.0-beta.0" }` (the `=` prefix ensures exact version matching)

This mapping ensures consistency across the ecosystem while following Rust's semantic versioning conventions.

## Automated Updates with Renovate Bot

Renovate bot can automatically keep your Rspack dependencies up to date by monitoring both `package.json` and `Cargo.toml` files.

### Setup

1. **Enable Renovate**: Add Renovate to your GitHub repository through the [GitHub App](https://github.com/apps/renovate).

2. **Configuration**: 
   - If you're using the [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template), the Renovate configuration is already set up for you.
   - For other projects, you can reference the [renovate.json](https://github.com/rspack-contrib/rspack-binding-template/blob/main/.github/renovate.json) file in the rspack-binding-template repository and copy it to your repository's `.github/renovate.json` file.

### Key Features

- **Automatic Detection**: Renovate automatically finds `package.json` and `Cargo.toml` files
- **Grouped Updates**: Related Rspack dependencies are updated together
- **Lock File Management**: Updates `Cargo.lock` and `package-lock.json`/`pnpm-lock.yaml`
- **Scheduled Updates**: Configure when updates should be proposed

### Configuration Features

The template configuration includes:

- **Grouped Updates**: All Rspack-related dependencies are updated together
- **Scheduled Updates**: Updates are proposed on a regular schedule
- **Lock File Management**: Automatic updates to `Cargo.lock` and Npm lock files
- **Version Strategy**: Optimized for Rspack's versioning approach

## Manual Version Bump Process

When you need to update Rspack versions manually, follow these steps to ensure consistency across your project.

### Prerequisites

Before starting the manual bump process, ensure you have:

- Access to edit both `Cargo.toml` (workspace root) and `package.json` files
- Understanding of the [version mapping strategy](#version-mapping-strategy)
- A clean git working directory

### Step-by-Step Process

1. **Identify Target Version**
   
   Determine the Rspack version you want to upgrade to:
   - Check [Rspack releases](https://github.com/web-infra-dev/rspack/releases) for the latest version
   - Note both Npm package version and corresponding Rust crate version

2. **Update Workspace Cargo.toml**

   Edit the workspace root `Cargo.toml` file:

   ```toml
   [workspace.dependencies]
   # Before (example)
   rspack_core = "0.4.9"
   rspack_hook = "0.4.9"
   
   # After (example)
   rspack_core = "0.5.0"
   rspack_hook = "0.5.0"
   ```

3. **Update package.json Files**

   Update the `package.json` file in the root:

   ```json
   {
     "dependencies": {
       "@rspack/core": "1.5.0"
     }
   }
   ```

4. **Update Lock Files**

   Regenerate lock files to ensure consistency:

   ```bash
   # For Npm dependencies
   pnpm install

   # For Rust dependencies
   pnpm run build # This will automatically update Cargo.lock and build the rust bindings
   ```


## Best Practices

### Recommended Approach

1. **Use Renovate for Regular Updates**: Set up Renovate bot for automated dependency updates
2. **Group Related Updates**: Update all Rspack dependencies together to avoid compatibility issues
3. **Test Thoroughly**: Always run your test suite after version updates
4. **Update Gradually**: For major version bumps, consider updating in stages

### Version Management Strategy

- **Patch Updates**: Can often be automated and merged quickly
- **Minor Updates**: Review changelog for new features and potential breaking changes
- **Major Updates**: Always review manually and test thoroughly
- **Pre-release Versions**: Use with caution in production environments

## Troubleshooting

### Common Issues

**Version Mismatch Between @rspack/core and Custom Binding**
```
Unmatched version @rspack/core@1.5.0 and binding version.

Help:
    Looks like you are using a custom binding (via environment variable 'RSPACK_BINDING=/path/to/binding').
    The expected version of @rspack/core to the current binding is 1.5.0-beta.0.
```
*Solution*: Ensure your custom binding and `@rspack/core` versions follow the [version mapping strategy](#version-mapping-strategy). Update both to matching versions.

### Getting Help

- Check the [Rspack documentation](https://rspack.dev/)
- Review [Rspack releases](https://github.com/web-infra-dev/rspack/releases) for changelog information
- Visit the [Rspack Discord](https://discord.gg/79ZZ66GH9E) for community support
- Review the [release workflow documentation](../first-custom-binding/release.md) for related processes
