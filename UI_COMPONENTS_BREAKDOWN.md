# CollabHub AI - Complete UI Components Breakdown

**Version**: 2.0.0
**Based On**: FireShot Capture 102 + Executive Team Requirements
**Date**: December 5, 2025

---

## 🎨 MAIN 3-PANEL LAYOUT

The CollabHub AI interface consists of **three primary panels**:

```
┌─────────────┬──────────────────────────────┬─────────────────┐
│             │                              │                 │
│   LEFT      │         CENTER               │     RIGHT       │
│   SIDEBAR   │    MAIN CONTENT              │    SIDEBAR      │
│   (Nav)     │    (Chat/Work Area)          │    (Details)    │
│             │                              │                 │
│   280px     │         Flexible             │     320px       │
│             │                              │                 │
└─────────────┴──────────────────────────────┴─────────────────┘
```

---

## 📋 LEFT SIDEBAR (Navigation & Tools)

### Top Section
**Brand & New Actions**
- [ ] CollabHub AI Logo
- [ ] "New Chat" Button (primary action)

---

### COLLABORATION Section (Expandable)
**Current Features** (Available Now):
- [x] 💬 **Chat** (Currently selected)
  - Access to text-based collaboration
  - Integration with AI agents
  - VERA attribution tracking

**Future Features** (Greyed Out):
- [ ] 🎥 **Meeting** (Coming Soon)
  - Video conferencing with agents
  - Screen sharing
  - Recording capabilities

- [ ] 🎨 **Whiteboard** (Coming Soon)
  - Collaborative drawing
  - Diagram creation
  - Agent participation

- [ ] 📺 **Screen Share** (Coming Soon)
  - Share your screen with agents
  - Collaborative debugging
  - Live demonstrations

---

### VERA ATTRIBUTION Section (Expandable)
**Current Features** (Available Now):
- [x] 📊 **Dashboard**
  - Real-time contribution tracking
  - Token usage statistics
  - Agent participation metrics

- [x] 📈 **Reports**
  - Contribution breakdowns by agent
  - Timeline visualizations
  - Export capabilities

- [x] 🔒 **IP Rights**
  - Certificate generation
  - Contribution verification
  - Blockchain export (prepared)

**Future Features** (Greyed Out):
- [ ] 🎓 **Certification** (Coming Soon)
  - Generate formal certificates
  - PDF export
  - Blockchain verification

---

### ANALYTICS Section (Expandable)
**Current Features** (Minimal - Basic tracking):
- [x] 📉 **Usage Stats**
  - Message count
  - Active agents
  - Session duration

**Future Features** (Greyed Out):
- [ ] 📊 **Advanced Analytics** (Coming Soon)
  - Detailed performance metrics
  - Cost tracking
  - Productivity insights

- [ ] 🎯 **Insights** (Coming Soon)
  - AI-powered recommendations
  - Pattern detection
  - Optimization suggestions

---

### FILES & RESOURCES Section (Expandable)
**Future Features** (All Greyed Out):
- [ ] 📁 **Documents** (Coming Soon)
  - Shared file storage
  - Version control
  - AI-assisted search

- [ ] 🔗 **Links** (Coming Soon)
  - Bookmarked resources
  - Shared references
  - Auto-categorization

- [ ] 📚 **Knowledge Base** (Coming Soon)
  - RAG integration
  - Searchable content
  - Agent training data

---

### SESSION RECORDING Section (Bottom)
**Current Features** (Available Now):
- [x] 🔴 **Record Session**
  - Start/Pause/Stop controls
  - Timer display
  - Pulsating REC indicator
  - Save recording metadata

---

### User Profile Section (Very Bottom)
- [x] User avatar
- [x] User name
- [x] Status indicator (online/away)
- [x] Settings menu (click to expand)
  - Account settings
  - Preferences
  - Logout

---

## 💬 CENTER PANEL (Main Work Area)

### Header Section
**Session Information**:
- [x] Channel/Session Name (e.g., "Multi-Agent Collaboration Session")
- [x] Active Participants Count
- [x] Action Buttons:
  - [x] 📞 Call (greyed out - future)
  - [x] 🎥 Video (greyed out - future)
  - [x] 🎨 Whiteboard (greyed out - future)

---

### Messages Area (Scrollable)
**Message Components**:

**System Messages**:
- [x] Timestamp
- [x] System icon
- [x] Message content
- [x] Distinct styling (grey background)

**Human User Messages**:
- [x] User avatar
- [x] User name
- [x] Timestamp
- [x] Message content
- [x] Blue accent color
- [x] Right-aligned (own messages)
- [x] Left-aligned (other users)

**AI Agent Messages**:
- [x] Agent avatar (will be generated/uploaded)
- [x] Agent name
- [x] Agent role badge (e.g., "Chief Strategy Officer")
- [x] Provider badge (Anthropic, OpenAI, etc.)
- [x] Timestamp
- [x] Message content
- [x] **VERA Badge** (orange/gold) - shows attribution
- [x] Token usage indicator (optional, on hover)
- [x] "Thinking..." indicator (while generating)

**Message Features**:
- [x] Markdown rendering
- [x] Code block syntax highlighting
- [x] Link previews
- [ ] File attachments (future)
- [ ] Image/video embeds (future)
- [x] Reply threading (basic)
- [ ] Reactions/emojis (future)

---

### Message Input Area (Bottom)

**Rich Text Editor Toolbar**:
- [x] **B** - Bold
- [x] **I** - Italic
- [x] 📎 - Attach file (greyed out initially)
- [x] 🖼️ - Insert image (greyed out initially)
- [x] `</>` - Code block
- [x] 😊 - Emoji picker
- [x] **@** - Mention user/agent

**Input Field**:
- [x] Multi-line text input
- [x] Auto-resize (grows with content)
- [x] Placeholder: "Type a message... @mention agents"
- [x] Character count (when approaching limit)

**Send Controls**:
- [x] Send button (primary action)
- [x] Keyboard shortcut hint (Enter to send, Shift+Enter for new line)

---

## 👥 RIGHT SIDEBAR (Participants & Details)

### Active in Session Section
**Shows all currently connected participants**:

**Human Users**:
- [x] Avatar
- [x] Name
- [x] Role/Title
- [x] Online status indicator (green dot)
- [x] "You" label for current user
- [x] Last active timestamp

Example:
```
● John Doe (You)
  CEO - Digital Muse Holdings
  Active now

● Team Member One
  Developer
  Active now

● Team Member Two
  Product Manager
  Active 2 min ago
```

---

### Available AI Agents Section (Scrollable)

**Executive Team** (Always visible at top):
- [x] Agent avatar/icon
- [x] Agent name
- [x] Role/title
- [x] Provider badge
- [x] Status indicator:
  - ✅ Available (green) - API configured
  - ⚠️ Unavailable (grey) - No API key
  - 🔴 Error (red) - API issue
- [x] @mention shortcut on click

**Example Display**:
```
EXECUTIVE TEAM

✅ Claude
   Chief Strategy Officer
   Anthropic • Available

✅ Manus
   Chief Architect
   Anthropic • Available

⚠️ Aria
   Chief Operations Officer
   OpenAI • Unavailable (Add API key)

⚠️ Gemini
   Chief Research Officer
   Google • Unavailable (Add API key)

⚠️ DeepSeek
   Chief Engineering Officer
   DeepSeek • Coming Week 2

⚠️ Grok
   Chief Innovation Officer
   xAI • Coming Week 2

⚠️ Sage
   Chief Information Officer
   Perplexity • Coming Week 2
```

**Future: Studio Team** (Collapsed by default):
- [ ] 40+ App Development Team agents
- [ ] Organized by department
- [ ] Searchable/filterable
- [ ] Batch @mention capability

---

### VERA Attribution Panel (Collapsible)

**Current Session Stats**:
- [x] **Contributions**: 12 (example)
- [x] **Contributors**: 4 (3 humans + 1 agent)
- [x] Pie chart or bar graph showing distribution
- [x] **Report** button - generates detailed report
- [x] **Certificate** button - mints VERA certificate

**Contribution Breakdown**:
```
Claude (Anthropic)     45%  |  342 tokens
John Doe (Human)       30%  |  198 tokens
Manus (Anthropic)      15%  |  124 tokens
Team Member One        10%  |   87 tokens
```

---

## 🎨 MODAL WINDOWS / POPUPS

### 1. New Chat Modal
**Triggered by**: "New Chat" button in left sidebar

**Contents**:
- [x] Chat/Session name input
- [x] Description (optional)
- [x] Select participants:
  - Checkboxes for humans
  - Checkboxes for agents (filtered by available)
- [x] Project association dropdown
- [x] Privacy settings (Private/Team/Public)
- [x] VERA enabled toggle (default: ON)
- [x] Recording enabled toggle (default: OFF)
- [x] Create button
- [x] Cancel button

---

### 2. Agent Details Modal
**Triggered by**: Clicking agent name/avatar

**Contents**:
- [x] Agent avatar (large)
- [x] Agent name and title
- [x] Provider and model info
- [x] Personality matrix visualization:
  - Directness: ████████░░ 8/10
  - Creativity: ████░░░░░░ 4/10
  - Formality: ████████░░ 8/10
  - Enthusiasm: █████░░░░░ 5/10
- [x] Specialties (tags)
- [x] Status and availability
- [x] Education/certifications (future)
- [x] Recent contributions
- [x] @mention button
- [x] Close button

---

### 3. VERA Certificate Modal
**Triggered by**: "Certificate" button in VERA panel

**Contents**:
- [x] Certificate preview (PDF-style)
- [x] Project/session name
- [x] Date range
- [x] List of all contributors with %
- [x] Total contributions count
- [x] Blockchain verification hash
- [x] Download PDF button
- [x] Share button
- [x] Close button

---

### 4. Settings Modal
**Triggered by**: User profile menu → Settings

**Tabs**:
1. **Account**
   - [x] Profile picture upload
   - [x] Display name
   - [x] Email (read-only)
   - [x] Password change
   - [x] Timezone

2. **Preferences**
   - [x] Theme (Light/Dark/Auto)
   - [x] Language
   - [x] Notification settings
   - [x] Default VERA setting
   - [x] Auto-save recordings

3. **Integrations**
   - [ ] Connected services (future)
   - [ ] Webhooks (future)
   - [ ] API access (future)

4. **Billing** (Admin only)
   - [ ] Current plan (future)
   - [ ] Usage statistics (future)
   - [ ] Payment method (future)

---

## 📱 RESPONSIVE BEHAVIOR

### Desktop (>1200px)
- All 3 panels visible
- Left sidebar: 280px fixed
- Right sidebar: 320px fixed
- Center: Flexible

### Tablet (768px - 1200px)
- Left sidebar collapsible (overlay)
- Center panel full width when sidebar collapsed
- Right sidebar stays visible

### Mobile (<768px)
- Single panel view
- Bottom navigation tabs
- Modals for sidebars
- Simplified header

---

## 🎨 DESIGN SYSTEM

### Color Palette
**Primary Colors**:
- Primary Blue: `#3B82F6`
- Primary Dark: `#1E40AF`
- Secondary Purple: `#8B5CF6`

**Agent Provider Colors**:
- Anthropic (Claude/Manus): `#D97706` (Orange)
- OpenAI (Aria): `#10B981` (Green)
- Google (Gemini): `#3B82F6` (Blue)
- xAI (Grok): `#EC4899` (Pink)
- DeepSeek: `#8B5CF6` (Purple)
- Perplexity (Sage): `#6366F1` (Indigo)

**VERA Attribution**: `#F59E0B` (Gold/Orange)

**Status Colors**:
- Available: `#10B981` (Green)
- Unavailable: `#6B7280` (Grey)
- Error: `#EF4444` (Red)
- Thinking: `#F59E0B` (Orange)

**Backgrounds**:
- Main BG: `#F9FAFB` (Light grey)
- Panel BG: `#FFFFFF` (White)
- Hover: `#F3F4F6` (Light grey)

### Typography
- **Headings**: Inter, sans-serif
- **Body**: Inter, sans-serif
- **Code**: Fira Code, monospace

**Font Sizes**:
- H1: 24px
- H2: 20px
- H3: 18px
- Body: 14px
- Small: 12px
- Tiny: 10px

---

## ⚡ INTERACTIVE STATES

### Buttons
- **Default**: Solid color, rounded corners
- **Hover**: Slightly darker, slight scale (1.02)
- **Active**: Even darker, scale (0.98)
- **Disabled**: Grey, cursor not-allowed, 50% opacity

### Links/Clickable Items
- **Hover**: Underline, color change
- **Active**: Different color

### Agent Status
- **Available**: Solid green indicator
- **Thinking**: Pulsating orange indicator
- **Typing**: Animated typing indicator
- **Offline**: Grey indicator

### Loading States
- **Page Load**: Skeleton screens
- **Message Send**: Sending indicator
- **Agent Response**: "Agent is thinking..." with animation
- **Data Fetch**: Spinner in relevant section

---

## 🔔 NOTIFICATIONS & TOASTS

### Notification Types
1. **Success** (Green)
   - "Message sent successfully"
   - "Certificate generated"
   - "Session recording saved"

2. **Error** (Red)
   - "Failed to send message"
   - "Agent unavailable"
   - "Connection lost"

3. **Warning** (Yellow)
   - "Agent will be available soon"
   - "API rate limit approaching"

4. **Info** (Blue)
   - "New agent joined session"
   - "VERA contribution recorded"
   - "User joined/left"

### Toast Position
- Top-right corner
- Stack vertically
- Auto-dismiss after 5 seconds
- Manual dismiss option

---

## 🚀 IMPLEMENTATION PRIORITY

### Phase 1: MVP (Week 1)
**Core 3-Panel Layout**:
- [x] Left sidebar with navigation
- [x] Center chat panel
- [x] Right sidebar with participants
- [x] Basic message display
- [x] Send message functionality

### Phase 2: Agent Integration (Week 1-2)
- [x] Agent list display
- [x] @mention functionality
- [x] Agent response rendering
- [x] Thinking indicators
- [x] VERA badges on messages

### Phase 3: VERA Features (Week 2)
- [x] VERA attribution panel
- [x] Real-time contribution tracking
- [x] Basic reporting

### Phase 4: Polish & UX (Week 2-3)
- [x] Animations and transitions
- [x] Responsive design
- [x] Dark mode
- [x] Keyboard shortcuts

### Phase 5: Future Features (Week 3+)
- [ ] Session recording UI
- [ ] Certificate generation modal
- [ ] Advanced analytics
- [ ] Video/whiteboard features

---

## 📝 SUMMARY

### Available Now (Phase 1-2)
- 3-panel layout
- Chat interface
- Executive Team roster
- Basic VERA attribution
- User authentication
- Real-time messaging
- Agent @mentions
- Thinking indicators

### Greyed Out (Coming Soon)
- Meeting/Video
- Whiteboard
- Screen Share
- Advanced Analytics
- File Sharing
- Knowledge Base
- Certificate PDFs
- 40+ Studio Team agents

### Admin-Only Features
- User management
- Billing (future)
- System settings
- Agent configuration
- API key management

---

**This UI breakdown provides a complete roadmap for building CollabHub AI with clear distinction between current MVP features and future enhancements!**

*Ready to start building the frontend based on this specification?* 🚀
