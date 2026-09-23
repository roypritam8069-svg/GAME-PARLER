# Game Parlour — User Flows

This document defines customer and Owner workflows.

---

## 1. Customer Discovery Flow

Home
→ Games
→ Pricing
→ Availability
→ Book Now

Primary goal:

Convert a visitor into a physical parlour booking.

---

## 2. Browse Games

Home
→ Games
→ Select Game
→ View Details
→ Book This Game

Game information:

- Name
- Image
- Platform
- Description
- Pricing information
- Availability

---

## 3. Booking Flow

Home
→ Book Now
→ Select Game
→ Select Station
→ Select Date
→ Select Time
→ Select Duration
→ Server Price Calculation
→ Customer Details
→ Payment Method
→ Confirmation

The server must re-check:

- Station
- Time
- Duration
- Pricing

before confirmation.

---

## 4. Counter Payment Flow

Customer selects:

Counter Payment

System:

1. Creates pending booking.
2. Reserves station according to booking policy.
3. Owner receives booking information.
4. Owner confirms payment at counter.
5. Payment status becomes paid.
6. Booking becomes confirmed.

---

## 5. Booking Confirmation Flow

Confirmed booking:

→ Generate Booking ID
→ Generate QR
→ Show confirmation
→ Generate WhatsApp message
→ Customer/Owner sends WhatsApp message if opted in

---

## 6. Cancellation Flow

Customer:

Booking
→ Cancel

System:

1. Verify booking ownership/access.
2. Check cancellation window.
3. Calculate refund.
4. Display refund amount.
5. Confirm cancellation.
6. Update booking status.
7. Create refund record where applicable.
8. Notify customer.

---

## 7. Availability Flow

Customer:

Select Date
→ Select Station
→ Select Time
→ Select Duration

Server:

1. Load confirmed bookings.
2. Load holds.
3. Load availability blocks.
4. Check parlour closure.
5. Check station status.
6. Return available slots.

Client availability is informational only.

Server is authoritative.

---

## 8. Concurrent Booking Flow

Customer A and Customer B select the same station/time.

Both requests reach server.

Server:

1. Re-check availability.
2. Start transaction.
3. Attempt reservation.
4. Database constraint/transaction prevents overlap.
5. One request succeeds.
6. Other request receives unavailable response.

Never trust client-side availability.

---

## 9. Owner Login Flow

Admin Login
→ Credentials
→ Server Authentication
→ Secure Session
→ Admin Dashboard

Requirements:

- Rate limiting
- Secure password hashing
- Secure cookie/session
- Server-side authorization

---

## 10. Owner Booking Flow

Admin
→ Bookings
→ Create Booking

Owner selects:

- Customer
- Game
- Station
- Date
- Time
- Duration
- Payment method

Server validates all data.

---

## 11. Game Management Flow

Admin
→ Games
→ Add/Edit Game
→ Save

Fields:

- Name
- Description
- Platform
- Image
- Status

Deletion should normally be archive/disable rather than destructive deletion.

---

## 12. Station Management Flow

Admin
→ Stations
→ Add/Edit Station

Fields:

- Name
- Console
- Status
- Availability

Owner can:

- Disable station
- Block station
- Re-enable station

---

## 13. Pricing Flow

Admin
→ Pricing
→ Create/Edit Rule

Rule may depend on:

- Game
- Station
- Duration
- Peak/off-peak
- Effective date

Confirmed booking stores historical price snapshot.

Future pricing changes must not change old bookings.

---

## 14. Offer Flow

Admin
→ Offers
→ Create Offer
→ Set validity
→ Set discount rules
→ Activate

Server validates offer eligibility.

---

## 15. Payment Flow

MVP:

Booking
→ Counter Payment
→ Owner confirms
→ Paid

Future:

Booking
→ Online Gateway
→ Provider
→ Server Verification
→ Confirmed

Client payment success must never be trusted without server verification.

---

## 16. WhatsApp Flow

Booking confirmed
→ Generate message
→ Customer/Owner chooses WhatsApp
→ Send manually

Marketing consent is separate from transactional notification consent.

---

## 17. Customer Account Flow

Customer:

Login
→ Account
→ Booking History
→ Booking Details

Customer must only access their own records.

---

## 18. Admin Analytics Flow

Admin
→ Reports

Available:

- Revenue
- Bookings
- Popular games
- Station utilization
- Peak hours
- Cancellation
- Refunds
- Payment reports

---

## 19. Parlour Closure Flow

Admin
→ Availability
→ Block Period
→ Select date/time
→ Reason
→ Confirm

Affected future availability must become unavailable.

Existing confirmed bookings require Owner review.

---

## 20. Error Handling

Every important flow must handle:

- Network failure
- Validation failure
- Booking conflict
- Payment failure
- Session expiration
- Server error
- Notification failure

Never show a false success message.

---

## 21. Flow Verification

Every implemented flow must be tested for:

- Happy path
- Invalid input
- Unauthorized access
- Concurrent request
- Failure recovery
- Mobile layout
- Bengali UI where applicable
