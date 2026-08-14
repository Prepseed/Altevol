# Altevol App APIs

Use these endpoints from the mobile app. This file is updated whenever a new API is added.

**Base URL (local):** `http://localhost:3000/api`  
**Content-Type:** `application/json`

Auth token (after login):

```
Authorization: Token <jwt>
```

Cookie `auth` is also set on login. Send credentials / token on authenticated calls.

---

## Auth

### Send OTP

`POST /users/otp/send`

**Auth:** none

```json
{
  "mobileNumber": "9999990001"
}
```

**Success**

```json
{
  "success": true,
  "message": "OTP ready (development — SMS not sent)",
  "otp": 123456
}
```

`otp` is returned only in development. In production, SMS is sent and `otp` is not returned.

---

### Verify OTP (login)

`POST /users/otp/verify`

**Auth:** none

```json
{
  "mobileNumber": "9999990001",
  "otp": "655251"
}
```

`otp` can be the SMS OTP, development OTP `123456`, or master OTP `655251`.

**Success**

```json
{
  "success": true,
  "token": "<jwt>",
  "data": {
    "_id": "...",
    "name": "Altevol Admin",
    "mobileNumber": "9999990001",
    "role": "admin",
    "uniqueCode": "SRT10-admin-001",
    "feesPaid": true,
    "batch": null
  }
}
```

Store `token` and send it as `Authorization: Token <jwt>` on later calls.

---

### Resend OTP

`POST /users/otp/resend`

**Auth:** none

```json
{
  "mobileNumber": "9999990001"
}
```

---

### Current user

`GET /users`

**Auth:** required

**Success**

```json
{
  "success": true,
  "token": "<jwt>",
  "data": {
    "_id": "...",
    "name": "Altevol Admin",
    "role": "admin",
    "uniqueCode": "SRT10-admin-001",
    "feesPaid": true,
    "batch": {
      "id": "...",
      "name": "Cricket 1",
      "sport": "cricket",
      "startTime": "06:00",
      "endTime": "08:00"
    }
  }
}
```

For `role: user`, `batch` is the assigned academy batch (or `null` if not assigned). Admin/guard usually have `batch: null`.

---

### Logout

`POST /users/logout`

**Auth:** required

---

## Entry form

Public walk-in form. No login required. Submitting this form **does not create a user**. It only saves the entry. Admins view submissions in the **Entry Forms** module.

### Submit entry form

`POST /entry-form`

**Auth:** none

```json
{
  "name": "Rahul Sharma",
  "mobileNumber": "9876543210",
  "email": "rahul@example.com",
  "howDidYouKnowAboutUs": "instagram",
  "howDidYouKnowOther": "",
  "visitedBefore": false,
  "knownPersonHere": true,
  "knownPersonName": "Amit Patel",
  "sport": "cricket",
  "playerLevel": "beginner",
  "age": 16,
  "preferredVisitDate": "2026-08-20",
  "message": "Want to join weekend batch"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Full name |
| `mobileNumber` | string | yes | 10-digit Indian mobile |
| `email` | string | yes | Valid email |
| `howDidYouKnowAboutUs` | string | yes | See values below |
| `howDidYouKnowOther` | string | if `other` | Free text |
| `visitedBefore` | boolean | yes | `true` / `false` |
| `knownPersonHere` | boolean | yes | `true` / `false` |
| `knownPersonName` | string | if `knownPersonHere` is true | Name of the person |
| `sport` | string | yes | `cricket` or `tennis` |
| `playerLevel` | string | no | `beginner`, `intermediate`, `competitive` |
| `age` | number | no | 3–80 |
| `preferredVisitDate` | string | no | ISO date |
| `message` | string | no | Extra notes |

`howDidYouKnowAboutUs` values:

- `google`
- `instagram`
- `facebook`
- `youtube`
- `friend_family`
- `hoarding`
- `website`
- `walk_in`
- `other`

**Success**

```json
{
  "success": true,
  "message": "Entry form submitted successfully",
  "data": {
    "id": "...",
    "name": "Rahul Sharma",
    "mobileNumber": "9876543210",
    "email": "rahul@example.com",
    "howDidYouKnowAboutUs": "instagram",
    "howDidYouKnowOther": "",
    "visitedBefore": false,
    "knownPersonHere": true,
    "knownPersonName": "Amit Patel",
    "sport": "cricket",
    "playerLevel": "beginner",
    "age": 16,
    "preferredVisitDate": "2026-08-20T00:00:00.000Z",
    "message": "Want to join weekend batch",
    "status": "new",
    "createdAt": "2026-08-14T09:00:00.000Z",
    "updatedAt": "2026-08-14T09:00:00.000Z"
  }
}
```

**Error**

```json
{
  "success": false,
  "error": "Name, mobile number, email, how did you know about us, and sport are required"
}
```

### List entry forms (admin)

`GET /entry-form?search=&sport=&status=&page=1&pageSize=20`

**Auth:** required (`admin` or `super`)

Query params:

| Param | Type | Required | Notes |
|---|---|---|---|
| `search` | string | no | Matches name, mobile, or email |
| `sport` | string | no | `cricket` or `tennis` |
| `status` | string | no | `new`, `contacted`, `scheduled`, `converted`, `closed` |
| `page` | number | no | Default `1` |
| `pageSize` | number | no | Default `20`, max `100` |

**Success**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "name": "Rahul Sharma",
        "mobileNumber": "9876543210",
        "email": "rahul@example.com",
        "howDidYouKnowAboutUs": "instagram",
        "howDidYouKnowOther": "",
        "visitedBefore": false,
        "knownPersonHere": true,
        "knownPersonName": "Amit Patel",
        "sport": "cricket",
        "playerLevel": "beginner",
        "age": 16,
        "preferredVisitDate": "2026-08-20T00:00:00.000Z",
        "message": "Want to join weekend batch",
        "status": "new",
        "createdAt": "2026-08-14T09:00:00.000Z",
        "updatedAt": "2026-08-14T09:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

### Get one entry form (admin)

`GET /entry-form/:id`

**Auth:** required (`admin` or `super`)

**Success**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Rahul Sharma",
    "mobileNumber": "9876543210",
    "email": "rahul@example.com",
    "sport": "cricket",
    "status": "new"
  }
}
```

---

### Check-in (scan user QR)

`POST /users/check-in`

**Auth:** required (`guard`, `admin`, or `super` to scan another person; a `user` can only check in themselves)

The guard app logs in, scans the player QR (`uniqueCode`), then calls this API.

```json
{
  "uniqueCode": "SRT10-001"
}
```

**Success**

```json
{
  "success": true,
  "message": "Checked in",
  "data": {
    "id": "...",
    "userId": "...",
    "name": "Altevol User",
    "uniqueCode": "SRT10-001",
    "feesPaid": true,
    "checkin": "2026-08-14T09:05:00.000Z",
    "alreadyCheckedIn": false
  }
}
```

If the same user is scanned again the same day, `alreadyCheckedIn` is `true` and `message` is `"Already checked in"`. There is no check-out.

**Fees not paid**

If `feesPaid` is `false`, check-in is not recorded:

```json
{
  "success": false,
  "error": "You cannot check in as you have not paid the fees",
  "data": {
    "userId": "...",
    "name": "Altevol User",
    "uniqueCode": "SRT10-001",
    "feesPaid": false
  }
}
```

Show this error to the scanner. Dummy users currently have `feesPaid: true`.

If admin marks the player **inactive** in Manage People, `feesPaid` becomes `false` and they cannot login. Scanning their QR then returns:

```json
{
  "success": false,
  "error": "You cannot check in as you have not paid the fees"
}
```

Marking them **active** again sets `feesPaid: true` and check-in works as before.

On the web user dashboard, clicking the QR also calls this same API so check-in can be tested without a scanner.

### List check-ins (admin)

`GET /users/check-ins?search=&page=1&pageSize=20`

**Auth:** required (`admin` or `super`)

**Success**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "userId": "...",
        "name": "Altevol User",
        "mobileNumber": "9999990002",
        "email": "altevol.user@dummy.local",
        "uniqueCode": "SRT10-001",
        "feesPaid": true,
        "checkin": "2026-08-14T09:05:00.000Z"
      }
    ],
    "recent": [],
    "total": 1,
    "page": 1,
    "pageSize": 20
  }
}
```

`items` is the full log till date. `recent` is the latest 10 check-ins for the side panel.

### My check-ins (user)

`GET /users/check-ins/me?page=1&pageSize=10`

**Auth:** required. Returns **only the logged-in user's** check-in logs.

**Success**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "...",
        "userId": "...",
        "name": "Altevol User",
        "uniqueCode": "SRT10-001",
        "feesPaid": true,
        "checkin": "2026-08-14T09:05:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

---

## Batches (admin)

Collection: `altevolBatches`. Seeded: Cricket 1, Cricket 2, Tennis 1, Tennis 2.

### List batches

`GET /batches`

**Auth:** required (`admin` or `super`)

### Create batch

`POST /batches`

```json
{
  "name": "Cricket 3",
  "sport": "cricket",
  "startTime": "06:00",
  "endTime": "08:00"
}
```

`startTime` and `endTime` are required (`HH:mm`, 24-hour). End time must be after start time.

### Update batch

`PATCH /batches/:id`

```json
{
  "name": "Cricket A",
  "sport": "cricket",
  "startTime": "16:00",
  "endTime": "18:00"
}
```

### Delete batch

`DELETE /batches/:id`

Fails if people are still in that batch. Move them first.

---

## Admin dashboard

`GET /users/dashboard`

**Auth:** required (`admin` or `super`)

Returns counts for Home:

```json
{
  "success": true,
  "data": {
    "checkIns": 12,
    "todayCheckIns": 3,
    "entries": 8,
    "people": 24,
    "unassigned": 2,
    "batches": [
      { "id": "...", "name": "Cricket 1", "sport": "cricket", "count": 10 }
    ]
  }
}
```

---

## Manage people (admin)

Lists `role: user` only. Inactive users cannot login. Inactive also sets `feesPaid: false`.

### List people

`GET /users/people?search=&batch=&isActive=&page=1&pageSize=20`

**Auth:** required (`admin` or `super`)

### Update person

`PATCH /users/people/:id`

```json
{ "isActive": false, "batchId": "..." }
```

| Field | Effect |
|---|---|
| `isActive: false` | Cannot login, `feesPaid` becomes `false`, check-in blocked |
| `isActive: true` | Can login, `feesPaid` becomes `true`, check-in allowed |
| `batchId` | Moves the player to that batch |

---

## Dummy login numbers (dev)

| Role | Unique code | Mobile | OTP |
|---|---|---|---|
| admin | `SRT10-admin-001` | `9999990001` | `123456` or `655251` |
| user (Cricket 1) | `SRT10-001` | `9999990002` | `123456` or `655251` |
| guard | `SRT10-guard-001` | `9999990003` | `123456` or `655251` |
| user (Tennis 1) | `SRT10-002` | `9999990004` | `123456` or `655251` |

Guard is for the scanner app. Login with `9999990003`, then `POST /users/check-in` with the scanned player's `uniqueCode`.

Create / refresh the guard user:

```bash
npm run seed:guard
```

Create / refresh the Tennis 1 player:

```bash
npm run seed:tennis-user
```

Seed default batches and assign dummy user `SRT10-001` to Cricket 1:

```bash
npm run seed:batches
```
