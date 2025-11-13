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
- Key tools: `find_symbol`, `get_symbols_overview`, `replace_symbol_body`, `find_referencing_symbols`, `search_for_pattern`

### Memory Keeper (`mcp__memory-keeper__*`)

Context and session management with git tracking

- Saving project context
- Tracking decisions
- Managing development sessions
- Creating checkpoints
- Key tools: `context_save`, `context_get`, `context_checkpoint`, `context_search`, `context_timeline`
- Supports channels, categories, priorities, and relationships between context items

### Brave Search (`mcp__MCP_DOCKER__brave_*`)

Comprehensive search engine capabilities

- Web search for current information
- News articles and breaking stories
- Image search
- Video search
- Local business and location search
- Key tools: `brave_web_search`, `brave_news_search`, `brave_image_search`, `brave_video_search`, `brave_local_search`
- **brave_summarizer**: AI-generated summaries of web search results (requires Pro AI subscription)

### Expo MCP (`mcp__expo-mcp__*`)

Expo framework-specific development tools

- Adding Expo libraries with usage instructions
- Searching official Expo documentation
- Generating project documentation (AGENTS.md, CLAUDE.md)
- Learning Expo-specific topics
- Key tools: `add_library`, `search_documentation`, `generate_agents_md`, `generate_claude_md`, `learn`
- **Always use** `search_documentation` for Expo-specific questions before implementing solutions

### Fetch (`mcp__MCP_DOCKER__fetch`)

Advanced web content fetching with image support

- Fetching web content
- Extracting images
- Converting HTML to Markdown
- Supports raw HTML or simplified markdown output

### ToolHive (`mcp__toolhive-mcp-optimizer__*`)

Tool discovery and execution optimization

- **Use this FIRST** when you need to find the right tool for a task
- Functions: `find_tool`, `call_tool`, `list_tools`
- Provides token efficiency metrics showing savings from tool filtering

### Sequential Thinking (`mcp__sequential-thinking__*`)

Complex problem-solving with chain-of-thought reasoning

- Breaking down complex problems
- Planning multi-step solutions
- Hypothesis generation and verification
- Dynamic thought adjustment and revision
- Supports branching and backtracking in reasoning

### MCP Management (`mcp__MCP_DOCKER__mcp-*`)

Dynamic MCP server management

- Adding/removing MCP servers at runtime
- Configuring server settings
- Discovering available servers in catalog
- Executing tools from any server
- Key tools: `mcp-find`, `mcp-add`, `mcp-remove`, `mcp-config-set`, `mcp-exec`

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
