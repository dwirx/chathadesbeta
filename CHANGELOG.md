# Changelog

All notable changes to HadesChat will be documented in this file.

## [Unreleased] - Agent Council Mode

### 🏛️ New Features

#### Agent Council Mode
- **3-Stage LLM Council Orchestration**: Multiple AI models deliberate together to provide the best answer
  - **Stage 1**: 5 models provide individual responses in parallel
  - **Stage 2**: Peer review and ranking of all responses (anonymized to prevent bias)
  - **Stage 3**: Chairman synthesizes final answer from collective wisdom
- **Free Models Integration**: Uses only free-tier models (zero cost!)
  - Llama 3.1 8B Instant (Groq)
  - Mixtral 8x7B (Groq)
  - Gemma2 9B (Groq)
  - Qwen3-Next 80B (Together AI) - Chairman & Council Member
  - Nvidia Nemotron Nano 12B (OpenRouter)
- **Rich UI Components**:
  - Dialog-based interface with real-time progress tracking
  - Progress bar showing current stage (1/2/3)
  - Tabbed view: Rankings, Stage 1 responses, Stage 2 peer reviews
  - Visual ranking hierarchy with gold/silver/bronze styling
  - Full markdown rendering for all responses
  - Session history tracking
  - Mobile-responsive design
- **Easy Access**:
  - Council button in ChatSidebar (Trophy icon 🏆)
  - Council card in SettingsSidebar
  - Keyboard shortcuts (coming soon)
- **Aggregate Rankings**: See which model's response was ranked best by peers
- **Transparency**: View every stage of the deliberation process

### 📚 Documentation
- `AGENT_COUNCIL.md` - Comprehensive guide (how it works, setup, usage, customization)
- `AGENT_COUNCIL_QUICKSTART.md` - 5-minute quick start guide
- `IMPLEMENTATION_SUMMARY.md` - Technical implementation details

### 🔧 Technical Details
- Core logic: `src/lib/agentCouncil.ts`
- UI component: `src/components/AgentCouncilMode.tsx`
- Parallel execution for optimal performance (~20-35 seconds total)
- Full TypeScript with proper types
- Zero linter errors
- Graceful degradation (works with 1+ providers)
- No breaking changes to existing features
- Reuses existing provider APIs (groqApi, togetherApi, openrouterApi)

### 🎯 Use Cases
- Complex questions requiring deep analysis
- Controversial topics needing multiple perspectives
- Critical decisions requiring validation
- Research and comprehensive answers
- Code review from multiple AI perspectives

## [2.1.0] - 2024-12-XX

### 🎉 New Features
- **Toggle Password Protection**: Dapat mengaktifkan/menonaktifkan password protection melalui `.env`
  - Environment variable: `VITE_ENABLE_PASSWORD_PROTECTION` (true/false)
  - Default: enabled (true) untuk keamanan
  - Berguna untuk development, demo, dan testing
  - Dokumentasi lengkap di `PASSWORD_TOGGLE_FEATURE.md` dan `CARA_TOGGLE_PASSWORD.md`

### 🔒 Security Improvements
- Password hashing dengan SHA-256 + fallback untuk kompatibilitas browser
- Rate limiting: Max 5 percobaan login, lockout 15 menit
- Session timeout otomatis (60 menit)
- Encrypted session storage dengan random tokens
- Anti-bypass protection (deteksi manipulasi console/storage)
- Timing attack prevention
- DevTools detection
- Storage manipulation detection

### 🐛 Bug Fixes
- Fix error "Cannot read properties of undefined (reading 'digest')" di browser yang tidak support Web Crypto API
- Tambah fallback hash mechanism untuk kompatibilitas maksimal
- Fix crypto.getRandomValues error dengan fallback pseudo-random generator

### 📚 Documentation
- `SECURITY_FEATURES.md` - Dokumentasi lengkap fitur keamanan
- `PANDUAN_KEAMANAN.md` - Panduan keamanan dalam Bahasa Indonesia
- `PASSWORD_TOGGLE_FEATURE.md` - Panduan toggle password protection
- `CARA_TOGGLE_PASSWORD.md` - Panduan singkat toggle (Bahasa Indonesia)
- `TROUBLESHOOTING.md` - Panduan troubleshooting 14+ masalah umum
- Update `PASSWORD_SETUP.md` dengan fitur baru
- Update `README.md` dengan informasi keamanan

### 🔧 Technical Changes
- Refactor `PasswordProtection.tsx` dengan security best practices
- Tambah environment variable `VITE_ENABLE_PASSWORD_PROTECTION`
- Improved error handling dan user feedback
- Better browser compatibility

## [Unreleased]
## [1.3.0] - 2025 - Agent Mode Relocation & Copy Markdown Feature

### 🚀 New Features

#### Copy Markdown Export
- **Chat Export**: Export entire chat sessions in markdown format
- **One-Click Copy**: Copy to clipboard directly from session dropdown menu
- **Rich Formatting**: Includes session metadata, timestamps, and message details
- **Metadata Preservation**: Duration, tokens, and speed data included in collapsible sections
- **User-Friendly Format**: Clean markdown with emoji indicators (👤 User, 🤖 AI)
- **Universal Compatibility**: Works with all markdown renderers and editors

**Use Cases:**
- Share conversations with colleagues
- Create documentation from AI interactions
- Archive important chat sessions
- Reference conversations in external documents
- Create training materials and tutorials

#### Agent Mode Relocation
- **Moved to Settings**: Agent Mode and ASS Debate Mode now accessible via Settings Sidebar
- **Cleaner Interface**: Removed floating button from main chat area
- **Special Features Section**: New dedicated section for advanced features
- **Better Organization**: All power features centralized in one location
- **Mobile Optimized**: More screen real estate on mobile devices

### 🎨 UI/UX Improvements

#### Cleaner Chat Interface
- **No Floating Elements**: Removed distracting floating Agent Mode button
- **Unobstructed View**: Full chat area visible without overlays
- **Professional Polish**: Cleaner, more focused user experience
- **Reduced Visual Clutter**: Better focus on chat content

#### Settings Sidebar Enhancement
- **Special Features Section**: New prominently styled section for Agent and Debate modes
- **Gradient Buttons**: Eye-catching gradient backgrounds for special features
- **Icon Integration**: Clear visual indicators with icons and descriptions
- **Quick Access**: One keyboard shortcut away (Ctrl/Cmd + K)

### 🔧 Technical Improvements

#### Code Quality
- **TypeScript Types**: Added `EnhancedModel` interface for better type safety
- **Error Handling**: Robust error handling for clipboard operations
- **Toast Notifications**: User feedback for all copy operations
- **Database Integration**: Efficient message retrieval from IndexedDB

#### Bug Fixes
- **AgentMode Variable Fix**: Fixed `sessionId` variable reference error in `updateSessionTitle`
- **Type Safety**: Eliminated `any` types in ChatSidebar model rendering

### 📝 Documentation
- **AGENT_COPY_FEATURE.md**: Complete technical documentation in English
- **PERUBAHAN_TERBARU.md**: User-friendly guide in Indonesian
- **Code Comments**: Improved inline documentation

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + K`: Quick access to Settings (and Agent Mode)

### 🌐 Browser Compatibility
- **Clipboard API**: Full support in Chrome, Firefox, Safari, and mobile browsers
- **Secure Context**: Works on HTTPS and localhost
- **Fallback Handling**: Graceful error messages if clipboard unavailable

---

## [1.2.0] - 2024 - Mobile-Optimized RAG Interface

### 🎯 Major UI/UX Improvements

#### Mobile Header Optimization
- **60% Size Reduction**: Mobile header reduced from 80-100px to 32-40px
- **Single Row Design**: Ultra-compact layout with inline badges
- **Smart Status Display**: RAG badge only shows when active with documents
- **Touch-Friendly**: 32x32px minimum touch targets for all buttons
- **Document Counter**: Compact superscript badge on documents icon

#### RAG Control Centralization
- **Settings Panel Integration**: RAG toggle moved to General Settings
- **Global Control**: Single source of truth for RAG enable/disable
- **Auto-Save**: Settings automatically persist to localStorage
- **Informative UI**: Descriptions and tips for all settings

#### Desktop Header Cleanup
- **Cleaner Layout**: Removed toggle switch, kept status display
- **Compact Badges**: Document count as small inline badges
- **Reduced Height**: Header reduced from 48px to 40px
- **Better Spacing**: Improved visual hierarchy and spacing

#### New Components
- **GeneralSettings**: Comprehensive settings panel with RAG control
  - Enable/Disable RAG globally
  - Auto-save sessions toggle
  - Confirm before delete toggle
  - Warning messages and helpful tips
  - Fully responsive design

### 📱 Mobile-First Improvements
- **Responsive Typography**: Scaled text sizes (12px mobile, 14px desktop)
- **Minimal Padding**: Optimized spacing (px-3 py-2 on mobile)
- **Compact Icons**: 16px icons for cleaner look
- **Space Efficiency**: More content visible without scrolling

### 🎨 Visual Enhancements
- **Inline Badges**: RAG status as compact badge instead of full text
- **Smart Visibility**: Optional elements auto-hide when not needed
- **Color Coding**: Green pulse for active, gray for disabled
- **Professional Polish**: Consistent sizing and spacing across breakpoints

### 📖 Documentation
- **RAG_TOGGLE_FEATURE.md**: Complete technical documentation
- **RAG_MOBILE_OPTIMIZED.md**: Quick reference guide
- **MOBILE_RAG_SUMMARY.md**: Implementation summary

### 🔧 Technical Changes
- Removed `onToggleRAG` prop from headers (read-only display)
- Centralized RAG control in Settings Panel
- Improved localStorage integration
- Better component separation of concerns

### 🚀 Performance Benefits
- Smaller DOM tree (fewer nodes)
- Less memory usage on mobile
- Faster render times
- Improved scroll performance

---

## [1.1.0] - 2024 - RAG & Web Search Integration

### 🎉 Major Features Added

#### RAG (Retrieval-Augmented Generation)
- **Web Search Integration**: AI responses now enhanced with real-time web search results
- **Dual Search Engine Support**: Choose between DuckDuckGo (free) or Brave Search (premium)
- **Smart Auto-Search**: Automatically detects questions and performs web searches
- **Context Augmentation**: Search results seamlessly integrated into AI prompts

#### Settings Sidebar
- **New Settings Panel**: Dedicated right sidebar for all configuration options
- **Smooth Animations**: Beautiful slide-in animation from right side
- **Mobile Responsive**: Full-width on mobile, overlay design
- **Persistent Storage**: All settings saved to localStorage
- **Organized Sections**: Accordion-based layout for easy navigation

#### Search Panel
- **Interactive Results Display**: Animated bottom panel showing search results
- **Click-to-Open**: Click any result to open source in new tab
- **Collapsible Interface**: Minimize/maximize to save screen space
- **Real-time Updates**: Live search status and result count
- **Visual Indicators**: Icons and badges for search engine and status

#### RAG Configuration Options
- **Enable/Disable Toggle**: Turn RAG on/off instantly
- **Search Engine Selection**: DuckDuckGo or Brave Search
- **Brave API Key Management**: Secure storage of API credentials
- **Max Results Control**: Choose 3, 5, 10, or 15 search results
- **Auto-Search Toggle**: Enable/disable automatic search detection

### ✨ UI/UX Improvements

#### Floating Action Buttons
- **Settings Button**: New floating button (⚙️) for quick access to settings
- **Repositioned Agent Mode**: Moved to floating button stack
- **Improved Accessibility**: Clear icons and tooltips

#### Headers Enhancement
- **RAG Status Indicator**: Shows when RAG is active
- **Search Progress**: Live indicator during web searches
- **Results Counter**: Displays number of sources found
- **Engine Badge**: Shows which search engine is being used

#### Mobile Optimizations
- **Responsive Settings Panel**: Full-width on mobile devices
- **Touch-Friendly Controls**: Larger tap targets for mobile
- **Bottom Sheet Pattern**: Native mobile UI patterns
- **Backdrop Overlay**: Focus on active panels
- **Smooth Transitions**: Native-feeling animations

### 🔧 Technical Improvements

#### New Components
```
src/components/SettingsSidebar.tsx    - Settings configuration panel
src/components/SearchPanel.tsx        - Search results display
src/components/RAGIndicator.tsx       - RAG status indicator
```

#### New Libraries & APIs
```
src/lib/searchApi.ts                  - Web search integration
src/hooks/useRAG.ts                   - RAG functionality hook
```

#### Search Implementation
- **DuckDuckGo API**: Free instant answer and lite search
- **Brave Search API**: Premium search with structured data
- **Query Extraction**: Smart extraction of search terms
- **Result Formatting**: Clean, readable result presentation
- **Error Handling**: Graceful fallbacks and error messages

#### State Management
- **Settings Persistence**: localStorage for user preferences
- **Search State**: Centralized search result management
- **Loading States**: Proper loading indicators throughout
- **Error States**: User-friendly error messages

### 📱 Responsive Design

#### Desktop (≥1024px)
- Settings sidebar slides in from right (384px width)
- Search panel appears bottom-right with rounded corners
- RAG indicator in desktop header
- Dual floating buttons on bottom-right

#### Tablet (768px - 1023px)
- Full-width settings panel
- Search panel bottom-anchored
- Optimized touch targets
- Responsive header layout

#### Mobile (<768px)
- Full-screen settings overlay
- Bottom-sheet search panel
- Mobile-specific RAG indicator
- Stacked floating buttons

### 🔐 Privacy & Security

#### API Key Management
- Keys stored in browser localStorage
- Never transmitted to our servers
- Encrypted by browser security
- User-controlled and deletable

#### Search Privacy
- DuckDuckGo: No tracking, privacy-focused
- Brave Search: Privacy-respecting API
- No search history on servers
- Ephemeral search sessions

### 📚 Documentation

#### New Documentation Files
- `RAG_SEARCH_GUIDE.md`: Comprehensive RAG feature guide
- `CHANGELOG.md`: Version history and changes
- Updated `README.md`: New features and setup instructions

#### Documentation Coverage
- Feature overview and benefits
- Setup instructions for both search engines
- API key acquisition guides
- Configuration options explained
- Troubleshooting section
- Technical architecture details
- Privacy and security information

### 🐛 Bug Fixes
- Fixed sidebar overflow on mobile devices
- Improved animation performance on low-end devices
- Fixed search panel z-index conflicts
- Resolved settings save race conditions

### ⚡ Performance Optimizations
- Lazy loading of search results
- Debounced settings save
- Optimized re-renders with proper memoization
- Reduced bundle size with code splitting

### 🎯 Auto-Search Detection

#### Question Patterns Detected
- Questions starting with: what, where, when, who, why, how
- Questions ending with "?"
- Queries with question words: is, are, can, could, would, should, do, does

#### Search Query Optimization
- Removes common question words
- Cleans punctuation
- Limits to first 10 words for better results
- Preserves key search terms

### 🔄 Integration Points

#### ChatArea Integration
- Automatic RAG context injection
- Search result callbacks
- Loading state coordination
- Result panel triggering

#### Header Integration
- Real-time RAG status display
- Search progress indicators
- Result count badges
- Engine identification

### 🎨 Design System Updates

#### New UI Elements
- Accordion components for settings organization
- Badge components for status display
- Animated panels with smooth transitions
- Loading spinners and progress indicators

#### Color Scheme
- Primary color for active states
- Muted colors for secondary info
- Success green for completed searches
- Warning orange for no results
- Destructive red for errors

### 📊 Metrics & Analytics (Coming Soon)
- Search usage statistics
- Popular query tracking
- Engine performance comparison
- RAG effectiveness metrics

### 🚀 Future Enhancements

#### Planned Features
- [ ] Manual search button in chat input
- [ ] Search history panel
- [ ] Custom search sources
- [ ] Google Search integration
- [ ] Bing Search integration
- [ ] Document upload for RAG
- [ ] Local knowledge base
- [ ] Search result caching
- [ ] Advanced filtering options
- [ ] Keyboard shortcuts
- [ ] Search templates
- [ ] Multi-language search
- [ ] Image search support
- [ ] News-specific search mode

#### Under Consideration
- [ ] Vector database integration
- [ ] Semantic search capabilities
- [ ] Citation generation
- [ ] Fact-checking indicators
- [ ] Source credibility scoring
- [ ] Search analytics dashboard

### 🙏 Acknowledgments
- DuckDuckGo for free search API
- Brave Search for privacy-focused search
- shadcn/ui for beautiful components
- Radix UI for accessible primitives

### 📝 Notes
- All settings are stored locally in browser
- No data sent to external servers except search APIs
- Search engines respect privacy policies
- Free tier limits apply to Brave Search API

---

## [1.0.0] - 2024 - Initial Release

### Features
- Multi-provider AI chat (Poe, Together AI, Groq, OpenRouter)
- Session management with IndexedDB
- Real-time streaming responses
- Agent Mode for multi-model comparison
- Debate Mode for AI discussions
- Responsive mobile design
- Performance metrics display

---

**Format**: [Major.Minor.Patch]
- **Major**: Breaking changes or significant new features
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes and minor improvements