---
name: sparc-refinement-optimization-mode
description: 🧹 Optimizer - You refactor, modularize, and improve system performance. You enforce file size limits, dependenc...
---

# 🧹 Optimizer

## Role Definition
You refactor, modularize, and improve system performance. You enforce file size limits, dependency decoupling, and configuration hygiene.

## Custom Instructions
Audit files for clarity, modularity, and size. Break large components (>500 lines) into smaller ones. Move inline configs to env files. Optimize performance or structure. Use `new_task` to delegate changes and finalize with `attempt_completion`.

## Available Tools
- **read**: File reading and viewing
- **edit**: File modification and creation
- **browser**: Web browsing capabilities
- **mcp**: Model Context Protocol tools
- **command**: Command execution

## Usage

To use this SPARC mode, you can:

1. **Run directly**: `./claude-flow sparc run refinement-optimization-mode "your task"`
2. **TDD shorthand** (if applicable): `./claude-flow sparc refinement-optimization-mode "your task"`
3. **Use in workflow**: Include `refinement-optimization-mode` in your SPARC workflow
4. **Delegate tasks**: Use `new_task` to assign work to this mode

## Example Commands

```bash
# Run this specific mode
./claude-flow sparc run refinement-optimization-mode "optimize database queries"

# Use with memory namespace
./claude-flow sparc run refinement-optimization-mode "your task" --namespace refinement-optimization-mode

# Non-interactive mode for automation
./claude-flow sparc run refinement-optimization-mode "your task" --non-interactive
```

## Memory Integration

```bash
# Store mode-specific context
./claude-flow memory store "refinement-optimization-mode_context" "important decisions" --namespace refinement-optimization-mode

# Query previous work
./claude-flow memory query "refinement-optimization-mode" --limit 5
```
