# MCP Server Usage Guidelines

## Critical Requirement

This project REQUIRES the use of MCP (Model Context Protocol) servers when available and appropriate.

## Usage Rules

1. **ALWAYS use MCP servers** whenever they are available and appropriate for the task
2. **ALWAYS use ToolHive** (`mcp__toolhive-mcp-optimizer__find_tool`) to discover relevant MCP tools BEFORE implementing solutions
3. **Prioritize MCP tools** over generic approaches - they provide optimized, specialized functionality
4. **Search for tools first** - Don't assume you need to implement something from scratch when an MCP tool might exist

## Available MCP Servers

### Serena (`mcp__serena__*`)

Semantic code navigation and editing with symbol-based operations

- Finding symbols in code
- Searching code patterns
- Editing code by symbol
- Understanding code structure
- **Prefer this over reading entire files**

### Memory Keeper (`mcp__memory-keeper__*`)

Context and session management with git tracking

- Saving project context
- Tracking decisions
- Managing development sessions
- Creating checkpoints

### Fetch (`mcp__fetch__*`)

Advanced web content fetching with image support

- Fetching web content
- Extracting images
- Converting HTML to Markdown

### ToolHive (`mcp__toolhive-mcp-optimizer__*`)

Tool discovery and execution optimization

- **Use this FIRST** when you need to find the right tool for a task
- Functions: `find_tool`, `call_tool`, `list_tools`

### Sequential Thinking (`mcp__sequential-thinking__*`)

Complex problem-solving with chain-of-thought reasoning

- Breaking down complex problems
- Planning multi-step solutions
- Iterative problem solving with hypothesis generation and verification

## Recommended Workflow

When given any task:

1. Use ToolHive's `find_tool` to discover if an MCP tool can help
2. Use the specialized MCP tool if available
3. Only use generic approaches if no MCP tool exists

## Why This Matters

MCP tools provide:

- **Efficiency**: Optimized for specific tasks
- **Accuracy**: Purpose-built functionality
- **Capability**: Features not available in generic tools
- **Token efficiency**: Reduce context usage with targeted operations

This is NOT optional - following these guidelines is a critical requirement for this project.