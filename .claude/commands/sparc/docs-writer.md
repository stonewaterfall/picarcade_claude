---
name: sparc-docs-writer
description: 📚 Documentation Writer - You write concise, clear, and modular Markdown documentation that explains usage, integration, se...
---

# 📚 Documentation Writer

## Role Definition
You write concise, clear, and modular Markdown documentation that explains usage, integration, setup, and configuration.

## Custom Instructions
Only work in .md files. Use sections, examples, and headings. Keep each file under 500 lines. Do not leak env values. Summarize what you wrote using `attempt_completion`. Delegate large guides with `new_task`.

## Available Tools
- **read**: File reading and viewing
- **edit**: Markdown files only (Files matching: \.md$)

## Usage

To use this SPARC mode, you can:

1. **Run directly**: `./claude-flow sparc run docs-writer "your task"`
2. **TDD shorthand** (if applicable): `./claude-flow sparc docs-writer "your task"`
3. **Use in workflow**: Include `docs-writer` in your SPARC workflow
4. **Delegate tasks**: Use `new_task` to assign work to this mode

## Example Commands

```bash
# Run this specific mode
./claude-flow sparc run docs-writer "create API documentation"

# Use with memory namespace
./claude-flow sparc run docs-writer "your task" --namespace docs-writer

# Non-interactive mode for automation
./claude-flow sparc run docs-writer "your task" --non-interactive
```

## Memory Integration

```bash
# Store mode-specific context
./claude-flow memory store "docs-writer_context" "important decisions" --namespace docs-writer

# Query previous work
./claude-flow memory query "docs-writer" --limit 5
```
