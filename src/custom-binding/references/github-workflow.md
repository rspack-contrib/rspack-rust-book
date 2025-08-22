# GitHub Workflow

This reference guide covers GitHub Actions workflows for Rspack custom bindings, using the rspack-toolchain and real-world examples from rspack-binding-template.

## Rspack Toolchain

The [rspack-toolchain](https://github.com/rspack-contrib/rspack-toolchain) provides reusable GitHub Actions for building and managing native Rspack bindings across multiple platforms.

### Available Actions

#### 1. Build Workflow (`build.yml`)

A reusable workflow for cross-platform native binding compilation.

**What it does:**
- **Phase 1 (get-napi-info job):** Calls the `get-napi-info` action to parse your `package.json` and generate a dynamic build matrix
- **Phase 2 (build job):** Uses the generated matrix to spawn parallel build jobs across different GitHub runners
- **Per-build job:** Sets up platform-specific toolchains (Rust with target support, Node.js, pnpm)
- **Compilation:** Executes your custom `napi-build-command` (e.g., `pnpm build --release`) for each target
- **Cross-compilation handling:** Automatically installs additional tools like Zig for musl targets, sets up Android NDK for ARM builds
- **Artifact upload:** Uploads each compiled `.node` file as a GitHub Actions artifact named `bindings-{target}`
- **Dependency management:** Caches Rust dependencies and Node.js packages for faster subsequent builds

**Inputs:**
- `package-json-path`: Path to binding package.json (default: `'crates/binding/package.json'`)
- `napi-build-command`: Command to build NAPI binding (default: `'pnpm build'`)

**Usage:**
```yaml
uses: rspack-contrib/rspack-toolchain/.github/workflows/build.yml@v1
with:
  package-json-path: 'crates/binding/package.json'
  napi-build-command: 'pnpm build --release'
```

**Platform Support:**
- macOS (Intel: `x86_64-apple-darwin`, Apple Silicon: `aarch64-apple-darwin`)
- Windows (64-bit: `x86_64-pc-windows-msvc`, 32-bit: `i686-pc-windows-msvc`, ARM64: `aarch64-pc-windows-msvc`)
- Linux GNU (64-bit: `x86_64-unknown-linux-gnu`, ARM64: `aarch64-unknown-linux-gnu`)
- Linux musl (64-bit: `x86_64-unknown-linux-musl`, ARM64: `aarch64-unknown-linux-musl`)
- Android ARM (`armv7-linux-androideabi`, `aarch64-linux-android`)

#### 2. Get NAPI Info Action (`get-napi-info`)

Extracts NAPI targets from `package.json` and generates a build matrix.

**What it does:**
- **File validation:** Checks if the specified `package.json` file exists and is readable
- **Target extraction:** Uses `jq` to parse the `napi.targets` array from your package.json
- **Target validation:** Validates each target against a predefined list of supported platforms (rejects unsupported targets)
- **Runner mapping:** Maps each target to the appropriate GitHub runner OS:
  - `*-apple-darwin` → `macos-latest`
  - `*-pc-windows-*` → `windows-latest` 
  - `*-unknown-linux-*` and `*-linux-*` → `ubuntu-latest`
- **Matrix generation:** Creates a JSON build matrix that GitHub Actions can consume for parallel job execution
- **Path calculation:** Determines the binding directory path by extracting the directory from the package.json path
- **Output provision:** Sets GitHub Actions outputs (`matrix`, `binding-directory`, `targets`) for downstream jobs

**Inputs:**
- `package-json-path`: Path to binding package.json
- `napi-build-command`: Command to build NAPI bindings

**Outputs:**
- Build matrix configuration
- Binding directory path

**Usage:**
```yaml
- uses: rspack-contrib/rspack-toolchain/get-napi-info@v1
  with:
    package-json-path: 'crates/binding/package.json'
    napi-build-command: 'pnpm build'
```

#### 3. Download Rspack Binding Action (`download-rspack-binding`)

Downloads native binding artifacts from GitHub Actions.

**What it does:**
- **Selective downloading:** If `target` input is provided, downloads only the artifact named `bindings-{target}`
- **Bulk downloading:** If no target specified, downloads all artifacts matching the `bindings-*` pattern
- **Artifact organization:** Uses GitHub Actions' `actions/download-artifact@v4` to retrieve `.node` files
- **Path management:** Places downloaded artifacts in the specified `path` directory (default: `artifacts`)
- **Dependency on build workflow:** Expects artifacts to have been previously uploaded by the build workflow with the naming convention `bindings-{target}`
- **Integration point:** Serves as the bridge between the build phase and testing/publishing phases in CI/CD pipelines

**Inputs:**
- `target`: Optional specific target to download
- `path`: Destination for downloaded artifacts

**Usage:**
```yaml
- uses: rspack-contrib/rspack-toolchain/download-rspack-binding@v1
  with:
    target: ${{ matrix.target }}
    path: ./bindings
```

### Workflow Connections and Data Flow

The rspack-toolchain actions work together in a specific sequence:

```text
package.json → get-napi-info → build.yml → download-rspack-binding
```

**Data Flow:**
1. **Input:** Your `package.json` contains `napi.targets` array specifying platforms to build for
2. **Matrix Generation:** `get-napi-info` parses this and creates a GitHub Actions matrix
3. **Parallel Builds:** `build.yml` uses the matrix to spawn parallel jobs, each building for one target
4. **Artifact Storage:** Each build job uploads a `.node` file as artifact named `bindings-{target}`
5. **Artifact Retrieval:** `download-rspack-binding` retrieves these artifacts for testing or publishing

**Key Dependencies:**
- `build.yml` depends on `get-napi-info` outputs (matrix, binding-directory)
- `download-rspack-binding` depends on artifacts created by `build.yml`
- All actions rely on consistent naming: `bindings-{target}` for artifacts

**Typical Workflow Pattern:**
```yaml
jobs:
  build:
    uses: rspack-contrib/rspack-toolchain/.github/workflows/build.yml@v1
  
  test:
    needs: [build]
    steps:
      - uses: rspack-contrib/rspack-toolchain/download-rspack-binding@v1
      - run: # test the downloaded bindings
  
  release:
    needs: [build, test]
    steps:
      - uses: rspack-contrib/rspack-toolchain/download-rspack-binding@v1
      - run: # package and publish
```

### Required Package.json Configuration

Your binding's `package.json` should include NAPI target configuration:

```json
{
  "scripts": {
    "build": "napi build --platform"
  },
  "napi": {
    "targets": [
      "x86_64-apple-darwin",
      "aarch64-apple-darwin",
      "x86_64-unknown-linux-gnu",
      "x86_64-pc-windows-msvc"
    ]
  }
}
```

## Real-World Examples

The [rspack-binding-template](https://github.com/rspack-contrib/rspack-binding-template) demonstrates practical workflow implementations.

This workflow setup ensures reliable, cross-platform builds and releases for Rspack custom bindings while maintaining flexibility for different project structures and requirements.

## Additional Resources

For the latest updates, complete source code, and advanced configuration options, visit the official repository: https://github.com/rspack-contrib/rspack-toolchain
