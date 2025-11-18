# Microfinance Loan Management System - Design Guidelines

## Design Approach
**Selected System**: Shadcn/ui (Radix UI + Tailwind CSS)  
**Rationale**: Financial dashboard application requiring professional, trustworthy aesthetics with data-dense displays. Shadcn/ui provides enterprise-grade components with excellent accessibility and TypeScript support.

**Design Principles**:
- Professional clarity over visual flair
- Information density with breathing room
- Clear visual hierarchy for risk indicators
- Efficient data scanning and action discovery

---

## Typography System

**Font Family**: Inter (via Google Fonts)
- Primary: Inter (weights: 400, 500, 600, 700)
- Monospace: JetBrains Mono for CNIC, amounts

**Hierarchy**:
- Page Titles: text-2xl font-bold (Dashboard, Clients, Loans)
- Section Headers: text-lg font-semibold
- Card Titles: text-base font-medium
- Body Text: text-sm font-normal
- Table Headers: text-xs font-medium uppercase tracking-wide
- Metrics/Numbers: text-3xl font-bold (dashboard cards)
- Helper Text: text-xs text-muted-foreground

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16**
- Component padding: p-4 or p-6
- Card spacing: p-6 for desktop, p-4 for mobile
- Section gaps: gap-6 or gap-8
- Form field spacing: space-y-4
- Dashboard grid gaps: gap-6

**Container Strategy**:
- Main app: Sidebar (w-64 fixed) + Content area (flex-1)
- Page containers: max-w-7xl mx-auto px-6 py-8
- Forms: max-w-2xl
- Tables: w-full with responsive scroll

**Grid Layouts**:
- Dashboard metrics: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Client cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- Loan details: Two-column split (8/4 ratio) on desktop

---

## Component Library

### Navigation
**Sidebar** (Fixed, full-height):
- Logo/Brand area at top (h-16)
- Navigation items with icons (Lucide React)
- Active state with accent border-left (w-1)
- Items: py-3 px-4 rounded-md hover state
- Collapse to icon-only on mobile

**Top Bar** (Optional secondary nav):
- User profile dropdown (right)
- Breadcrumbs (left)
- h-14 with border-bottom

### Dashboard Cards
**Metric Cards** (Shadcn Card component):
- Structure: Icon (top-left) + Label + Large number + Trend indicator
- Height: min-h-32
- Icon size: w-8 h-8
- Hover: subtle scale (hover:scale-105 transition)

**Chart Cards**:
- Header with title + period selector
- Chart area: min-h-80
- Use Recharts with Shadcn theming
- Responsive: ResponsiveContainer wrapper

### Forms
**Input Fields** (Shadcn Form + Input):
- Label above input (font-medium text-sm mb-2)
- Input height: h-10
- Error states below input (text-xs text-destructive)
- CNIC input: Monospace font, 13-digit validation feedback
- Dropdowns: Shadcn Select component

**Form Layout**:
- Single column on mobile
- Two-column grid (grid-cols-2 gap-4) for paired fields on desktop
- Action buttons: justify-end gap-2 mt-6

### Tables
**Data Tables** (Shadcn Table):
- Sticky header on scroll
- Zebra striping: every other row subtle background
- Row hover state
- Column widths: Auto-fit with min-widths
- Mobile: Stack important columns, horizontal scroll for full view
- Action buttons: Right-aligned in last column

**Repayment Schedule Table** (Special):
- Status badges in dedicated column
- Due date with relative time ("2 days overdue")
- Amount in monospace, right-aligned
- Action buttons per row (Mark Paid)

### Badges & Indicators
**Risk Level Badges**:
- Size: px-2.5 py-0.5 text-xs font-semibold rounded-full
- Icons: Include status indicator dot
- Positions: Top-right of cards or inline with name

**Status Badges**:
- Paid: Success styling
- Pending: Warning styling  
- Overdue: Destructive styling with pulse animation

### Alerts & Notifications
**Default Risk Banner**:
- Full-width alert at top of loan detail page
- Icon (AlertTriangle) + Message + Dismiss button
- Use Shadcn Alert component (destructive variant)

**Toast Notifications**:
- Bottom-right position
- Auto-dismiss (4 seconds)
- Success/Error variants for actions

### Search & Filters
**Search Bar**:
- Icon prefix (Search icon)
- Placeholder: "Search by name or CNIC..."
- Width: w-full md:w-96
- Debounced input

**Filter Dropdowns**:
- Inline with search on desktop
- Risk level filter, Loan status filter
- Multi-select capability

---

## Page-Specific Layouts

### Dashboard (Landing)
- 4-column metric cards (top)
- Two-column: Risk chart (left) + Recent activity table (right)
- Overdue section (full-width, collapsible)

### Client List
- Search bar + Add Client button (top)
- Grid of client cards (3 columns desktop)
- Each card: Avatar + Name + CNIC + Risk badge + View button

### Loan Detail
- Header: Client info + Loan summary (side-by-side)
- Repayment schedule table (full-width)
- Payment action modal (Shadcn Dialog)

### Client Onboarding Form
- Single-column centered form (max-w-2xl)
- Progress indicator if multi-step (future)
- AI Risk Score result: Large card with score + explanation after save

---

## Responsive Behavior

**Breakpoints**:
- Mobile: < 768px (stack all, sidebar collapses to bottom nav)
- Tablet: 768px - 1024px (2-column grids)
- Desktop: > 1024px (full layout)

**Mobile Adaptations**:
- Sidebar → Bottom navigation bar (4-5 items max)
- Tables → Card list view for complex tables
- Forms → Full-width single column
- Dashboard metrics → 2 columns then stack

---

## Icons
**Library**: Lucide React (via CDN or npm)
- Navigation: LayoutDashboard, Users, Wallet, Receipt
- Actions: Plus, Search, Filter, MoreVertical
- Status: CheckCircle, Clock, AlertTriangle, XCircle
- Risk: Shield, TrendingUp, TrendingDown

---

## Animations
**Minimal & Purposeful**:
- Page transitions: None (instant navigation)
- Hover states: Scale or opacity (transition-all duration-200)
- Loading: Skeleton screens (Shadcn Skeleton) for data-heavy views
- Badge pulse: Only for critical alerts (overdue, high risk)
- Avoid: Scroll animations, complex transitions

---

## Images
**None required** - This is a data-centric dashboard application. Focus on charts, tables, and data visualization rather than imagery.