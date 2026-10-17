# API route map

This is the single API folder for the project. It contains every URL entry
point required by Next.js. Keep routes organized by the URL they serve.

```text
auth/[...nextauth]          Login session endpoint
mobile/auth/login           Mobile tenant/technician login
mobile/auth/refresh         Rotate a mobile refresh token
mobile/auth/session         Validate a mobile access token
mobile/auth/logout          Revoke a mobile refresh session
dashboard                   Admin dashboard data
notifications               Notifications data
properties/[id]             Edit or deactivate one property
properties                  Property list and create endpoint
reports                     Reports data
requests/[id]               Edit, delete, or convert one request
requests                    Request list and create endpoint
session                     Current session endpoint
technician-tickets          Technician ticket list
technicians/[id]            Edit or deactivate one technician
technicians                 Technician list and create endpoint
tenants/[id]                Edit or deactivate one tenant
tenants                     Tenant list and create endpoint
tickets/[id]                Edit or delete one ticket
tickets                     Ticket list and create endpoint
tickets/[id]/assign         Assign a technician
tickets/[id]/billing        Complete billing and close a ticket
tickets/[id]/comments       Read or add ticket comments
tickets/[id]/status         Change ticket status
```

Each `route.ts` contains the complete handler for its endpoint. Keep related
logic beside the URL it serves so the API is easy to navigate.
