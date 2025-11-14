# System Architecture

## Overview

BehavioralTrack follows a three-tier architecture pattern:
- **Presentation Layer** (React Frontend)
- **Application Layer** (Express Backend)
- **Data Layer** (MySQL Database)

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│         Mobile/Tablet Browser           │
└────────────────┬────────────────────────┘
                 │ HTTPS
                 ▼
┌─────────────────────────────────────────┐
│        React Frontend (Vite)            │
│  ┌─────────────────────────────────┐   │
│  │  Components                      │   │
│  │  - TallyCounter                  │   │
│  │  - DurationTimer                 │   │
│  │  - SessionList                   │   │
│  │  - ExportDialog                  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  State Management (Context API) │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  API Service (Axios)            │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │ REST API (JSON)
                 ▼
┌─────────────────────────────────────────┐
│      Node.js/Express Backend            │
│  ┌─────────────────────────────────┐   │
│  │  Routes                          │   │
│  │  /api/sessions                   │   │
│  │  /api/behaviors                  │   │
│  │  /api/clients                    │   │
│  │  /api/export                     │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Controllers                     │   │
│  │  - Session Controller            │   │
│  │  - Behavior Controller           │   │
│  │  - Export Controller             │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Models                          │   │
│  │  - Session Model                 │   │
│  │  - Behavior Model                │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │ SQL Queries
                 ▼
┌─────────────────────────────────────────┐
│           MySQL Database                │
│  ┌─────────────────────────────────┐   │
│  │  Tables                          │   │
│  │  - users                         │   │
│  │  - clients                       │   │
│  │  - sessions                      │   │
│  │  - behaviors                     │   │
│  │  - behavior_logs                 │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Component Details

### Frontend (React)

#### Key Components

**TallyCounter**
- Displays behavior name and current count
- Increment button with haptic feedback
- Real-time updates without page refresh
- Touch-optimized for mobile

**DurationTimer**
- Start/stop button for timing behaviors
- Display of elapsed time (HH:MM:SS)
- Auto-save on stop
- Background timer continues if tab unfocused

**SessionDashboard**
- Overview of current session
- List of behaviors being tracked
- Quick access to all counters/timers
- Session metadata (client, date, therapist)

**ExportDialog**
- CSV export for data analysis
- PDF export for reports/records
- Date range selection
- Filter by client or behavior

#### State Management

Using React Context API for:
- Current session state
- Active behavior logs
- User authentication state
- Real-time counter/timer values

**Why Context API?**
- Lightweight (no additional dependencies)
- Perfect for app-wide state
- Easy to understand and maintain
- Sufficient for this app's complexity

#### API Service Layer

Centralized API calls using Axios:
- Consistent error handling
- Request/response interceptors
- Token management for auth
- Retry logic for network issues

### Backend (Express)

#### API Design Principles

**RESTful Endpoints**
- Clear, resource-based URLs
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Consistent response format
- Meaningful status codes

**Middleware Stack**
1. **CORS** - Enable cross-origin requests
2. **Body Parser** - Parse JSON payloads
3. **Auth Middleware** - Verify JWT tokens
4. **Error Handler** - Catch and format errors
5. **Logger** - Request/response logging

#### Controllers

Handle business logic and orchestration:
- Input validation
- Call appropriate models
- Format responses
- Error handling

#### Models

Database interaction layer:
- Execute SQL queries
- Data transformation
- Transaction management
- Query optimization

### Database (MySQL)

#### Schema Design

**Core Tables:**

1. **users** - Therapist accounts
2. **clients** - Therapy clients
3. **sessions** - Therapy sessions
4. **behaviors** - Behavior definitions
5. **behavior_logs** - Individual behavior records

**Design Principles:**
- Normalized to 3NF (reduce redundancy)
- Foreign keys for referential integrity
- Indexes on frequently queried columns
- Timestamps for audit trail

## Data Flow

### Creating a Behavior Tally

1. User clicks increment button in UI
2. React component updates local state (immediate feedback)
3. API call sent to backend (`POST /api/behaviors`)
4. Express controller validates request
5. Model inserts record into `behavior_logs` table
6. Success response sent to frontend
7. Frontend confirms save with UI indicator

### Exporting Session Data

1. User selects export format (CSV/PDF)
2. Frontend sends request with filters
3. Backend queries all relevant behavior logs
4. Data formatted into CSV or PDF
5. File streamed back to client
6. Browser downloads file

## Security Considerations

### Authentication
- JWT tokens for stateless auth
- Secure password hashing (bcrypt)
- Token expiration and refresh

### Data Protection
- Input sanitization to prevent SQL injection
- XSS protection via React's default escaping
- HTTPS enforcement in production
- Environment variables for secrets

### Authorization
- Therapists can only access their own clients
- Session-based access control
- Role-based permissions (future: admin role)

## Performance Optimizations

### Frontend
- Code splitting by route
- Lazy loading for export features
- Memoization of expensive computations
- Debouncing of API calls

### Backend
- Database connection pooling
- Query optimization with proper indexes
- Caching of frequently accessed data
- Gzip compression for responses

### Database
- Composite indexes on common query patterns
- Partitioning for large datasets (future)
- Regular EXPLAIN analysis of slow queries

## Scalability Considerations

### Current Phase
- Single server deployment
- Good for 100-500 concurrent users
- Suitable for small-to-medium practices

### Future Growth
- Load balancer + multiple app servers
- Database read replicas
- Redis for session caching
- CDN for static assets

## Mobile-First Approach

### Design Principles
- Touch targets minimum 44x44px
- Readable text (16px minimum)
- Simple, uncluttered interface
- Fast load times on 3G/4G

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### PWA Considerations (Future)
- Service worker for offline capability
- Add to home screen
- Push notifications for reminders

## Error Handling Strategy

### Frontend
- User-friendly error messages
- Retry mechanisms for network failures
- Graceful degradation
- Error boundary components

### Backend
- Structured error responses
- Detailed logging for debugging
- HTTP status codes
- Stack traces in development only

## Monitoring & Logging

### Development
- Console logging
- React DevTools
- Network tab inspection

### Production
- Error tracking (e.g., Sentry)
- Access logs
- Performance metrics
- Database slow query log

## Deployment Architecture

### cPanel Setup
```
public_html/
├── index.html          # React build output
├── assets/            # JS, CSS, images
└── api/               # Proxy to Node.js app
```

### Process Flow
1. React build generates static files
2. Upload to public_html
3. Node.js app runs on cPanel Node.js selector
4. Apache proxies /api requests to Node.js
5. MySQL database on same host

See [deployment.md](deployment.md) for detailed steps.
