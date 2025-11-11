# 12-Step Tracker Documentation

Welcome to the comprehensive documentation for the 12-Step Tracker application. This directory contains all the guides and references you need to use, develop, and maintain the application.

## Documentation Overview

### For End Users

#### [User Guide for Sponsees](./USER_GUIDE_SPONSEE.md)

Complete guide for sponsees using the app to work through their recovery journey.

**Topics Covered**:

- Getting started and account creation
- Connecting with a sponsor
- Working with tasks
- Exploring the 12 steps
- Tracking your journey
- Communicating with your sponsor
- Managing your profile
- Understanding notifications

**Audience**: Individuals working through the 12-step program with a sponsor

---

#### [User Guide for Sponsors](./USER_GUIDE_SPONSOR.md)

Complete guide for sponsors using the app to support their sponsees.

**Topics Covered**:

- Getting started as a sponsor
- Managing sponsees
- Creating and managing tasks
- Monitoring progress
- Communication best practices
- Task templates and workflows
- Managing multiple sponsees
- Handling crisis situations

**Audience**: Individuals sponsoring others through the 12-step program

---

### For Developers

#### [Developer Setup Guide](./DEVELOPER_GUIDE.md)

Step-by-step guide to set up your development environment and start contributing.

**Topics Covered**:

- Prerequisites and required software
- Initial project setup
- Environment configuration
- Supabase setup and database migrations
- Running the application (web, iOS, Android)
- Development workflow
- Building for production
- Troubleshooting common issues

**Audience**: Developers new to the project

---

#### [Supabase API Documentation](./API_SUPABASE.md)

Comprehensive API reference for Supabase integration.

**Topics Covered**:

- Client setup and configuration
- Type definitions for all database tables
- Authentication methods (email, OAuth)
- Database operations (CRUD)
- Row Level Security policies
- Common queries and examples
- Error handling patterns
- Best practices

**Audience**: Developers working with database and authentication

---

#### [Context Providers API Documentation](./API_CONTEXTS.md)

Complete API reference for React Context providers.

**Topics Covered**:

- **AuthContext**:
  - Authentication state management
  - Sign in/up/out methods
  - Google OAuth integration
  - Profile management
  - Session handling
- **ThemeContext**:
  - Theme management (light/dark/system)
  - Color palettes
  - Theme persistence
  - Usage examples

**Audience**: Developers working with authentication and theming

---

### Setup & Configuration

#### [Google OAuth Setup](../GOOGLE_OAUTH_SETUP.md)

Detailed instructions for configuring Google Sign-In.

**Topics Covered**:

- Google Cloud Console configuration
- Supabase provider setup
- OAuth credentials
- Redirect URI configuration
- Mobile deep linking
- Platform-specific setup (iOS, Android, Web)

**Audience**: Developers setting up OAuth authentication

---

## Quick Start Guides

### I'm a Sponsee

1. Start with [User Guide for Sponsees](./USER_GUIDE_SPONSEE.md)
2. Create your account
3. Connect with your sponsor using their invite code
4. Begin working on your first tasks

### I'm a Sponsor

1. Start with [User Guide for Sponsors](./USER_GUIDE_SPONSOR.md)
2. Create your account and complete your profile
3. Generate invite codes for your sponsees
4. Create task templates and start guiding your sponsees

### I'm a Developer

1. Start with [Developer Setup Guide](./DEVELOPER_GUIDE.md)
2. Set up your development environment
3. Configure Supabase
4. Run the app locally
5. Read [API Documentation](./API_SUPABASE.md) and [Context Documentation](./API_CONTEXTS.md)
6. Make your first contribution

---

## Documentation Structure

```
docs/
├── README.md                    # This file - documentation overview
├── USER_GUIDE_SPONSEE.md       # Complete guide for sponsees
├── USER_GUIDE_SPONSOR.md       # Complete guide for sponsors
├── DEVELOPER_GUIDE.md          # Developer setup and workflow
├── API_SUPABASE.md             # Supabase integration API reference
└── API_CONTEXTS.md             # React Context providers API reference
```

---

## Key Concepts

### For Users

**Roles**:

- **Sponsee**: Someone working through the 12 steps with guidance from a sponsor
- **Sponsor**: Someone who has completed the steps and guides others
- **Both**: Can be both a sponsor and sponsee simultaneously

**Core Features**:

- **Task System**: Sponsors assign tasks to guide sponsees through each step
- **Progress Tracking**: Visual representation of progress through the 12 steps
- **Direct Messaging**: Secure communication between sponsors and sponsees
- **Sobriety Tracking**: Count days sober and celebrate milestones
- **Slip-Up Support**: Private tracking for recovery restarts (visible only to user)
- **Invite Codes**: Secure way for sponsors to connect with sponsees

### For Developers

**Technology Stack**:

- **Frontend**: React Native 0.81.4 with React 19
- **Framework**: Expo 54
- **Router**: Expo Router v6 (file-based routing)
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email + Google OAuth)
- **Storage**: expo-secure-store (native) / localStorage (web)
- **Language**: TypeScript with strict mode
- **UI**: Custom theming with light/dark mode support

**Architecture**:

- File-based routing with grouped routes
- Context providers for global state (Auth, Theme)
- Row Level Security for data access control
- Platform-aware storage adapter
- Type-safe database operations

---

## Contributing to Documentation

### Documentation Standards

1. **Clear Structure**: Use headings, subheadings, and table of contents
2. **Code Examples**: Include practical, working examples
3. **Error Handling**: Show how to handle common errors
4. **Cross-References**: Link to related documentation
5. **Keep Updated**: Update docs when code changes

### Updating Documentation

When making changes to the app:

1. **New Feature**: Add to relevant user guide and API docs
2. **API Change**: Update API documentation immediately
3. **Breaking Change**: Clearly document in all affected guides
4. **Configuration Change**: Update Developer Guide

### Documentation Checklist

When adding a new feature:

- [ ] Update relevant user guide
- [ ] Add API documentation if applicable
- [ ] Include code examples
- [ ] Add to this README if it's a major feature
- [ ] Update table of contents

---

## Getting Help

### For Users

**Technical Support**:

- Email: support@12steptracker.com
- Check user guides for common questions

**Recovery Support**:

- AA Hotline: 1-800-839-1686
- National Suicide Prevention Lifeline: 988
- SAMHSA Treatment Referral: 1-800-662-4357

### For Developers

**Documentation Issues**:

- Create an issue in the repository
- Submit a pull request with corrections

**Technical Questions**:

- Review [Developer Guide](./DEVELOPER_GUIDE.md)
- Check [API Documentation](./API_SUPABASE.md)
- Consult external resources:
  - [Expo Docs](https://docs.expo.dev/)
  - [Supabase Docs](https://supabase.com/docs)
  - [React Native Docs](https://reactnative.dev/)

---

## Additional Resources

### Project Files

- **Main README**: `../README.md` - Project overview and quick start
- **CLAUDE.md**: `../CLAUDE.md` - Instructions for Claude Code AI assistant
- **Google OAuth Setup**: `../GOOGLE_OAUTH_SETUP.md` - OAuth configuration guide

### External Documentation

- **Expo**: [docs.expo.dev](https://docs.expo.dev/)
- **React Native**: [reactnative.dev](https://reactnative.dev/)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **TypeScript**: [typescriptlang.org/docs](https://www.typescriptlang.org/docs/)
- **Expo Router**: [expo.github.io/router](https://expo.github.io/router/docs/)

### Community Resources

- **AA Official**: [aa.org](https://www.aa.org/)
- **AA Big Book**: Available online and in print
- **Local Meetings**: Find meetings at [aa.org/find-aa](https://www.aa.org/find-aa)

---

## Document Versions

All documentation in this directory:

- **Last Updated**: January 2025
- **Version**: 1.0
- **Compatible with**: Expo SDK 54, React Native 0.81.4

---

## Feedback

We welcome feedback on our documentation! If you find:

- Unclear instructions
- Missing information
- Outdated content
- Errors or typos

Please:

1. Create an issue in the repository
2. Tag it with "documentation"
3. Provide specific details about what needs improvement

Or submit a pull request with corrections!

---

**Thank you for using 12-Step Tracker!**

Whether you're here to support your recovery journey or to contribute to the codebase, we're glad you're here. Remember: recovery is possible, and every step forward matters.

_One day at a time._

---

_This documentation is maintained by the 12-Step Tracker development team._
