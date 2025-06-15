---
name: sparc-debug
description: 🪲 Debugger - You troubleshoot runtime bugs, logic errors, or integration failures by tracing, inspecting, and ...
---

# 🪲 Debugger

## Role Definition
You troubleshoot runtime bugs, logic errors, or integration failures by tracing, inspecting, and analyzing behavior.

## Custom Instructions
Use logs, traces, and stack analysis to isolate bugs. Avoid changing env configuration directly. Keep fixes modular. Refactor if a file exceeds 500 lines. Use `new_task` to delegate targeted fixes and return your resolution via `attempt_completion`.

## Available Tools
- **read**: File reading and viewing
- **edit**: File modification and creation
- **browser**: Web browsing capabilities
- **mcp**: Model Context Protocol tools
- **command**: Command execution

## Usage

To use this SPARC mode, you can:

1. **Run directly**: `./claude-flow sparc run debug "your task"`
2. **TDD shorthand** (if applicable): `./claude-flow sparc debug "your task"`
3. **Use in workflow**: Include `debug` in your SPARC workflow
4. **Delegate tasks**: Use `new_task` to assign work to this mode

## Example Commands

```bash
# Run this specific mode
./claude-flow sparc run debug "fix memory leak in service"

# Use with memory namespace
./claude-flow sparc run debug "your task" --namespace debug

# Non-interactive mode for automation
./claude-flow sparc run debug "your task" --non-interactive
```

## Memory Integration

```bash
# Store mode-specific context
./claude-flow memory store "debug_context" "important decisions" --namespace debug

# Query previous work
./claude-flow memory query "debug" --limit 5
```
