# API Documentation

Base URL: `http://localhost:3000/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Endpoints

### Authentication

#### Register User
```
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "therapist@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "credentials": "BCBA, LBA"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "therapist@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "therapist@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "therapist@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Clients

#### Get All Clients
```
GET /api/clients
```

**Query Parameters:**
- `search` (optional) - Search by name
- `active` (optional) - Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "Sarah",
      "lastName": "Smith",
      "dateOfBirth": "2015-03-15",
      "active": true,
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

#### Get Single Client
```
GET /api/clients/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Sarah",
    "lastName": "Smith",
    "dateOfBirth": "2015-03-15",
    "active": true,
    "notes": "Client notes...",
    "createdAt": "2024-01-10T08:00:00Z"
  }
}
```

#### Create Client
```
POST /api/clients
```

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Smith",
  "dateOfBirth": "2015-03-15",
  "notes": "Initial assessment notes..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "Sarah",
    "lastName": "Smith",
    "dateOfBirth": "2015-03-15",
    "active": true,
    "createdAt": "2024-01-10T08:00:00Z"
  },
  "message": "Client created successfully"
}
```

#### Update Client
```
PUT /api/clients/:id
```

**Request Body:**
```json
{
  "firstName": "Sarah",
  "lastName": "Smith-Johnson",
  "notes": "Updated notes..."
}
```

#### Delete Client
```
DELETE /api/clients/:id
```

---

### Sessions

#### Get All Sessions
```
GET /api/sessions
```

**Query Parameters:**
- `clientId` (optional) - Filter by client
- `startDate` (optional) - Filter from date (YYYY-MM-DD)
- `endDate` (optional) - Filter to date (YYYY-MM-DD)
- `limit` (optional) - Number of results (default: 50)
- `offset` (optional) - Pagination offset

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "clientId": 1,
      "clientName": "Sarah Smith",
      "sessionDate": "2024-11-14",
      "startTime": "2024-11-14T10:00:00Z",
      "endTime": "2024-11-14T11:00:00Z",
      "notes": "Session notes...",
      "behaviorCount": 5
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

#### Get Single Session
```
GET /api/sessions/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "clientId": 1,
    "clientName": "Sarah Smith",
    "sessionDate": "2024-11-14",
    "startTime": "2024-11-14T10:00:00Z",
    "endTime": "2024-11-14T11:00:00Z",
    "notes": "Session notes...",
    "behaviors": [
      {
        "id": 1,
        "name": "Hand Raising",
        "type": "tally",
        "count": 12,
        "logs": [...]
      },
      {
        "id": 2,
        "name": "On-Task Behavior",
        "type": "duration",
        "totalDuration": 2400,
        "logs": [...]
      }
    ]
  }
}
```

#### Create Session
```
POST /api/sessions
```

**Request Body:**
```json
{
  "clientId": 1,
  "sessionDate": "2024-11-14",
  "startTime": "2024-11-14T10:00:00Z",
  "notes": "Session goals..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "clientId": 1,
    "sessionDate": "2024-11-14",
    "startTime": "2024-11-14T10:00:00Z",
    "createdAt": "2024-11-14T10:00:00Z"
  },
  "message": "Session created successfully"
}
```

#### Update Session
```
PUT /api/sessions/:id
```

**Request Body:**
```json
{
  "endTime": "2024-11-14T11:00:00Z",
  "notes": "Updated session notes..."
}
```

#### End Session
```
POST /api/sessions/:id/end
```

Automatically sets endTime to current time.

---

### Behaviors

#### Get Behaviors for Session
```
GET /api/sessions/:sessionId/behaviors
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sessionId": 1,
      "name": "Hand Raising",
      "type": "tally",
      "description": "Student raises hand before speaking",
      "count": 12,
      "createdAt": "2024-11-14T10:00:00Z"
    },
    {
      "id": 2,
      "sessionId": 1,
      "name": "On-Task Behavior",
      "type": "duration",
      "description": "Time student is focused on task",
      "totalDuration": 2400,
      "createdAt": "2024-11-14T10:00:00Z"
    }
  ]
}
```

#### Create Behavior
```
POST /api/behaviors
```

**Request Body:**
```json
{
  "sessionId": 1,
  "name": "Hand Raising",
  "type": "tally",
  "description": "Student raises hand before speaking"
}
```

Types: `tally` or `duration`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "sessionId": 1,
    "name": "Hand Raising",
    "type": "tally",
    "count": 0,
    "createdAt": "2024-11-14T10:00:00Z"
  },
  "message": "Behavior created successfully"
}
```

#### Update Behavior
```
PUT /api/behaviors/:id
```

**Request Body:**
```json
{
  "name": "Hand Raising (Updated)",
  "description": "Updated description..."
}
```

#### Delete Behavior
```
DELETE /api/behaviors/:id
```

---

### Behavior Logs

#### Get Logs for Behavior
```
GET /api/behaviors/:behaviorId/logs
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "behaviorId": 1,
      "timestamp": "2024-11-14T10:15:23Z",
      "value": 1,
      "notes": null
    },
    {
      "id": 2,
      "behaviorId": 1,
      "timestamp": "2024-11-14T10:18:45Z",
      "value": 1,
      "notes": null
    }
  ]
}
```

#### Log Tally Increment
```
POST /api/behaviors/:behaviorId/logs
```

**Request Body:**
```json
{
  "type": "tally",
  "timestamp": "2024-11-14T10:15:23Z",
  "notes": "Optional note about this instance"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "behaviorId": 1,
    "timestamp": "2024-11-14T10:15:23Z",
    "value": 1,
    "notes": null
  }
}
```

#### Log Duration
```
POST /api/behaviors/:behaviorId/logs
```

**Request Body:**
```json
{
  "type": "duration",
  "startTime": "2024-11-14T10:15:00Z",
  "endTime": "2024-11-14T10:25:00Z",
  "duration": 600,
  "notes": "10 minutes on-task"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "behaviorId": 2,
    "startTime": "2024-11-14T10:15:00Z",
    "endTime": "2024-11-14T10:25:00Z",
    "duration": 600,
    "notes": "10 minutes on-task"
  }
}
```

---

### Export

#### Export Session to CSV
```
GET /api/export/csv/:sessionId
```

**Response:**
CSV file download with headers:
```
Session ID,Client Name,Session Date,Behavior Name,Type,Timestamp,Value,Notes
```

#### Export Session to PDF
```
GET /api/export/pdf/:sessionId
```

**Response:**
PDF file download with formatted session report including:
- Session header (client, date, therapist)
- Behavior summary (counts, durations)
- Detailed log timeline
- Charts/graphs (future enhancement)

#### Export Multiple Sessions
```
POST /api/export/bulk
```

**Request Body:**
```json
{
  "format": "csv",
  "sessionIds": [1, 2, 3],
  "clientId": 1,
  "startDate": "2024-11-01",
  "endDate": "2024-11-30"
}
```

Provide either `sessionIds` OR `clientId` + date range.

---

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `500 Internal Server Error` - Server error

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user

## Pagination

List endpoints support pagination:
- `limit` - Items per page (default: 50, max: 100)
- `offset` - Number of items to skip

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 250,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

## Filtering & Sorting

Most list endpoints support:
- `search` - Full-text search
- `sortBy` - Field to sort by
- `sortOrder` - `asc` or `desc`

Example:
```
GET /api/clients?search=smith&sortBy=lastName&sortOrder=asc
```

## Timestamps

All timestamps are in ISO 8601 format (UTC):
```
2024-11-14T10:15:23Z
```

## Error Codes

Application-specific error codes:

- `AUTH_INVALID_CREDENTIALS` - Login failed
- `AUTH_TOKEN_EXPIRED` - JWT expired
- `VALIDATION_ERROR` - Input validation failed
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `PERMISSION_DENIED` - User lacks permission
- `DUPLICATE_ENTRY` - Resource already exists
- `DATABASE_ERROR` - Database operation failed

## Webhooks (Future Enhancement)

Planned webhook support for:
- Session completed
- Daily summary
- Export generated
