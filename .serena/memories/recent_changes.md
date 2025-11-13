# Recent Changes and Updates

## Latest Updates (November 2025)

### MCP Server Additions

The project now has comprehensive MCP (Model Context Protocol) server integration with the following servers:

1. **Brave Search** - Web, news, image, video, and local search capabilities
2. **Expo MCP** - Expo-specific development tools and documentation search
3. **MCP Management** - Dynamic server management and discovery
4. **Serena** - Semantic code navigation (existing)
5. **Memory Keeper** - Context management (existing)
6. **ToolHive** - Tool discovery and optimization (existing)
7. **Sequential Thinking** - Advanced problem-solving (existing)
8. **Fetch** - Web content fetching (existing)

### Application Configuration Updates

#### App Icon Change

- Changed from `./assets/images/icon.png` to `./assets/images/logo.png`
- Updated in both `app.json` for general config and iOS-specific settings

#### EAS Build Configuration

- **Production Profile Enhancements**:
  - Added `APP_ENV=production` environment variable
  - Added OTA update channel: `production`
  - Maintains auto-increment version numbers

### Authentication Features

#### Implemented

- Email/password authentication ✓
- Google OAuth integration ✓ (see GOOGLE_OAUTH_SETUP.md)
- Facebook Sign In ✓ (see FACEBOOK_SIGNIN_SETUP.md)

#### Planned

- Apple Sign In (design complete, implementation pending)
  - Documentation: docs/plans/2025-11-12-apple-signin-design.md
  - Will follow same pattern as Google/Facebook OAuth
  - Comprehensive setup guide to be created (APPLE_SIGNIN_SETUP.md)

### Dependency Updates

Recent package.json changes included version adjustments for compatibility:

- `@react-native-community/datetimepicker`: 8.5.0 → 8.4.4
- `react-native-gesture-handler`: ~2.29.0 → ~2.28.0
- `react-native-screens`: ~4.18.0 → ~4.16.0
- `react-native-svg`: 15.14.0 → 15.12.1
- `react-native-webview`: 13.16.0 → 13.15.0
- `react-native-worklets`: ^0.6.1 → ^0.5.1
- `@types/jest`: ^30.0.0 → ^29.5.14

These changes appear to be rollbacks for compatibility with the current Expo/React Native versions.

### Documentation Updates

All documentation has been updated to reflect:

- New MCP server capabilities
- Enhanced authentication options
- Updated build configuration
- Current dependency versions

Key documentation files updated:

- CLAUDE.md - Project overview and MCP server documentation
- Memories (mcp_usage_guidelines, tech_stack) - Updated with new capabilities
