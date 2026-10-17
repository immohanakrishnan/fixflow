# FixFlow AI mobile API

The Expo app uses the existing Next.js API. It does not connect directly to
MySQL and must never receive `DATABASE_URL`, `AUTH_SECRET`, or any other server
secret.

## Local Expo configuration

Create this variable in the Expo app's `.env` file:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

Use the development machine's LAN IP, not `localhost`, when testing on a real
phone. Android Emulator normally uses `http://10.0.2.2:3000`; iOS Simulator can
use `http://localhost:3000`. The phone and computer must be on the same network,
and the Next.js server must be reachable through the Windows firewall.

Example API helper:

```ts
const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export async function api(path: string, options: RequestInit = {}) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}
```

## Mobile authentication

### Login

`POST /api/mobile/auth/login`

```json
{
  "email": "tenant1@fixflow.demo",
  "password": "demo1234"
}
```

Only active tenants and active technicians can use mobile login. The response
contains a short-lived `accessToken`, a rotating `refreshToken`, `expiresIn`,
and the safe user profile (`id`, `name`, `email`, `role`). Store both tokens in
Expo SecureStore. Do not use AsyncStorage for tokens.

### Authenticated requests

Send the access token on every request:

```http
Authorization: Bearer <accessToken>
```

### Validate session

`GET /api/mobile/auth/session`

This returns the current mobile user and validates the access token, session
expiry, revocation state, and current tenant/technician activity state.

### Refresh

`POST /api/mobile/auth/refresh`

```json
{ "refreshToken": "..." }
```

Refresh tokens rotate on every successful call. Replace the stored refresh
token with the returned token. If refresh returns `401`, clear both tokens and
send the user to login.

### Logout

`POST /api/mobile/auth/logout`

```json
{ "refreshToken": "..." }
```

The refresh session is revoked and the access token becomes invalid as well.

## Mobile-consumable business APIs

The existing APIs are reused:

| Purpose | Endpoint | Tenant | Technician |
|---|---|---:|---:|
| Load assigned/request data | `GET /api/requests` | Own requests | Requests linked to assigned tickets |
| Load tenant property/unit | `GET /api/properties` | Assigned property/unit | Authenticated read |
| Create request | `POST /api/requests` | Yes | No |
| Load assigned tickets | `GET /api/technician-tickets` | No | Yes |
| Update ticket status | `PATCH /api/tickets/:id/status` | Own ticket only | Assigned ticket only |
| Read comments | `GET /api/tickets/:id/comments` | Own ticket only | Assigned ticket only |
| Add comment | `POST /api/tickets/:id/comments` | Own ticket only | Assigned ticket only |

Status body:

```json
{ "status": "IN_PROGRESS", "note": "Started work" }
```

Allowed statuses are `OPEN`, `TRIAGE`, `READY_FOR_ASSIGNMENT`, `ASSIGNED`,
`IN_PROGRESS`, `RESOLVED`, and `CLOSED`. Existing billing and closure rules
remain unchanged.

## Creating a request with a photo

The existing request endpoint accepts JSON. A photo can be sent as a data URL
in the `attachment` object:

```json
{
  "title": "AC is not cooling",
  "description": "The bedroom unit is blowing warm air.",
  "propertyId": "property-id",
  "unitId": "unit-id",
  "attachment": {
    "filename": "ac.jpg",
    "mimeType": "image/jpeg",
    "url": "data:image/jpeg;base64,..."
  }
}
```

JPG, PNG, and WebP are accepted up to 5 MB. The backend validates the payload
size and stores the existing attachment in the request record. The workflow and
classification behavior are unchanged.
