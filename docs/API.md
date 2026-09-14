# API Reference

Base URL: `/`

## Public API

### List active recipients
`GET /api/public/recipients`

### List active organizations
`GET /api/public/organizations`

### Search saved delivery people
`GET /api/public/delivery-persons?q=kwame`

An empty `q` returns up to 100 active records for kiosk selection. The public list includes id, name and organization only — phone and email are not returned.

### Record a delivery
`POST /api/public/deliveries`

```json
{
  "deliveryPersonId": null,
  "fullName": "Kwame Mensah",
  "phone": "0200000000",
  "email": "kwame@example.com",
  "organizationId": 3,
  "organizationName": null,
  "recipientId": 7,
  "subject": "Request for Information",
  "referenceNumber": "REF-100",
  "description": "Original signed copy"
}
```

Use `deliveryPersonId` for a returning visitor. Use either `organizationId` or `organizationName`. Phone and email are only needed when creating a new delivery person.

Successful response: HTTP `201 Created` with a random tracking token (format `XXXX-XXXX-XXXX`) and the server delivery time. Tracking numbers are not derived from the database id.

### Public tracking
`GET /api/public/deliveries/{trackingNumber}`

Returns a deliberately reduced view: tracking number, status, recipient and timestamps. Sender details and subject are not exposed by the public tracking API.

## Reception API

Requires HTTP Basic authentication with a `RECEPTIONIST` or `ADMIN` account.

### Pending deliveries
`GET /api/reception/deliveries/pending`

### Confirm physical receipt
`POST /api/reception/deliveries/{id}/receive`

```json
{
  "remarks": "Physical letter verified at front desk"
}
```

The backend takes the receiving user from the authenticated session; clients cannot choose `receivedBy` or `receivedAt`.

## Administration API

Requires HTTP Basic authentication with an `ADMIN` account.

- `GET /api/admin/recipients`
- `POST /api/admin/recipients`
- `PUT /api/admin/recipients/{id}`
- `GET /api/admin/organizations`
- `POST /api/admin/organizations`
- `PUT /api/admin/organizations/{id}`

HTML administration also supports staff account creation, password reset, enable/disable, recipient editing and organization editing.

## Error format

Validation/API errors use JSON similar to:

```json
{
  "timestamp": "2026-09-14T10:47:21Z",
  "message": "Validation failed",
  "errors": {
    "subject": "must not be blank"
  }
}
```
