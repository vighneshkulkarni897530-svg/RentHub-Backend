# Phase 12A – Enterprise Payments, Delivery & Notifications

## Scope (approved)
Complete after Phase 11. No UI redesign, no breaking API changes, preserve existing logic.

### 1. Payments
- [ ] Complete Razorpay production integration (validate existing)
- [ ] Payment history (exists — verify)
- [ ] Refund workflow (Refund model + service + routes)
- [ ] PDF invoices (Invoice model + service)
- [ ] Owner settlements (Payout model + service)
- [ ] Payout tracking

### 2. Delivery
- [ ] Delivery partners (DeliveryPartner model)
- [ ] Pickup scheduling (extend booking service)
- [ ] Delivery tracking (exists — enhance)
- [ ] Return tracking
- [ ] OTP verification (exists — verify)
- [ ] Booking timeline (exists — verify)

### 3. Notifications
- [ ] Email
- [ ] Push (PushSubscription model + dispatch)
- [ ] SMS (Twilio/MSG91 adapter - graceful fallback)
- [ ] In-app notifications (exists)
- [ ] Notification preferences (NotificationPreference model + service)

### 4. Email Templates
- [ ] Welcome
- [ ] Verify Email
- [ ] Booking Confirmation
- [ ] Booking Approved
- [ ] Booking Cancelled
- [ ] Payment Success
- [ ] Refund
- [ ] Password Reset
- [ ] Delivery Updates

### 5. Backend
- [ ] Models
- [ ] Repositories
- [ ] Services
- [ ] Controllers
- [ ] Routes
- [ ] Validators
- [ ] Tests

### 6. Frontend
- [ ] API integration
- [ ] Invoice page
- [ ] Delivery tracking page
- [ ] Notification preferences page

### Verification
- [ ] Backend tests pass
- [ ] Backend build passes
- [ ] Frontend build passes
- [ ] Report files created/modified + verification results
