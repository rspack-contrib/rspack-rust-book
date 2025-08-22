# Rspack Rust Book Documentation Guidelines

This file contains project-specific instructions for maintaining the Rspack Rust Book documentation.

## Project Overview

The rspack-rust-book is comprehensive documentation for Rust development with Rspack. While it currently focuses on custom bindings, it will expand to cover additional Rust-related aspects of the Rspack ecosystem.

## Rspack Reference

For any Rspack-related questions, always reference the official LLM-optimized documentation at:
https://rspack.rs/llms.txt

This ensures accurate and up-to-date information about Rspack features, APIs, and best practices.

## Documentation Standards

### Writing Style
- Use clear, direct language
- Maintain a friendly but professional tone
- Focus on actionable instructions
- Provide practical examples

### Formatting
- Use proper headings hierarchy (##, ###, ####)
- Include code examples with appropriate syntax highlighting
- Use callouts for important information (> **⚠️ Warning**, > **Note**)
- Cross-reference related sections with proper links

## Technical Guidelines

### Code Blocks
- Use `text` syntax for error messages to prevent Rust compilation errors during documentation tests
- Use appropriate language tags (`rust`, `json`, `toml`, `bash`)
- Include `(the = prefix ensures exact version matching)` when showing Cargo.toml examples

### Capitalization Rules
- "Npm" (not "npm") when referring to the package manager
- "Rust" (always capitalized)
- "JavaScript" (full word, properly capitalized)
- "Node.js" (with proper styling)

### Experimental Stage Warnings
Include experimental stage warnings for features that are still evolving:

```markdown
> **⚠️ Experimental Stage**: [Feature name] is currently in experimental stage. APIs are likely to change in the future as the ecosystem evolves.
```

### References and Examples
- Use official Rspack repositories for practical examples
- Reference actual file contents when showing examples
- Cross-reference related documentation sections
- Link to relevant GitHub repositories and configurations

## Testing Considerations

- Avoid using generic code block syntax for error messages
- Use `text` syntax to prevent documentation test failures
- Ensure all code examples are syntactically correct
- Test links and references for accuracy

## Quality Checklist

Before finalizing documentation:
- [ ] Rspack information verified against https://rspack.rs/llms.txt
- [ ] Code blocks use appropriate syntax
- [ ] Cross-references are working
- [ ] Experimental warnings are included where appropriate
- [ ] Capitalization is consistent
- [ ] Examples reference actual repository files
