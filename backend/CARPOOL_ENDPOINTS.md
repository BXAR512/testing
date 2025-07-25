# Carpool Endpoints

The carpool endpoints follow the same privacy pattern as the privacy endpoints, using handlers and services to manage access control and data filtering.

## Authentication

All carpool endpoints require authentication. Users must be logged in with a valid session.

## Endpoints

### GET /carpool/event/:eventId/participants

Get carpool participants for a specific event with privacy controls.

**Parameters:**
- `eventId` (number): The ID of the event

**Response:**
```json
{
  "success": true,
  "participants": [
    {
      "id": 1,
      "userId": 123,
      "username": "john_doe",
      "role": "student",
      "coordinatesId": 456,
      "isAnon": false
    }
  ],
  "handler": "ViewCarpoolHandler-Owner",
  "reason": "Access granted"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Access Denied",
  "handler": "ViewCarpoolHandler-Denied"
}
```

### GET /carpool/user/:userId/display-name

Get the display name for a user in carpool context (respects privacy settings).

**Parameters:**
- `userId` (number): The ID of the user

**Response:**
```json
{
  "success": true,
  "displayName": "john_doe",
  "userId": 123
}
```

### GET /carpool/event/:eventId/can-view

Check if the current user can view carpool participants for an event.

**Parameters:**
- `eventId` (number): The ID of the event

**Response:**
```json
{
  "success": true,
  "canView": true,
  "eventId": 123,
  "requesterId": 456
}
```

## Access Control

The carpool endpoints use the same privacy handler pattern as the privacy endpoints:

1. **Event Creator**: Can always view carpool participants
2. **Public Event Attendees**: Can view carpool participants for public events
3. **Private Event Attendees**: Can view carpool participants only if they are attending the event
4. **Non-attendees**: Cannot view carpool participants for private events

## Privacy Features

- Anonymous users are filtered out from carpool participant lists
- Display names respect user privacy settings (anonymous usernames vs real usernames)
- Access control is enforced at the handler level
- All responses include handler information for debugging

## Handler Types

- `ViewCarpoolHandler-Owner`: Event creator access
- `ViewCarpoolHandler-Public`: Public event access
- `ViewCarpoolHandler-Attendee`: Private event attendee access
- `ViewCarpoolHandler-Denied`: Access denied
- `ViewCarpoolHandler-EventNotFound`: Event not found
- `ViewCarpoolHandler-NoEvent`: No event ID provided 