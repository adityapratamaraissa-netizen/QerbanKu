# Security Specification for QurbanKu

## Data Invariants
1. A participant cannot be created with a `PAID` status by the client.
2. A participant of type `SAPI` must have a valid `groupId`.
3. A `QurbanGroup` can have at most 7 participants.
4. Only admins can verify or change payment status.
5. Users can only read their own participant data if they have the ID (Public lookup).

## The Dirty Dozen Payloads
1. **Identity Spoofing**: Attempt to create a participant with a different user's UID (if auth was fully linked, though currently it's ID based).
2. **Privilege Escalation**: Attempt to create a participant with `paymentStatus: 'PAID'`.
3. **Shadow Field**: Adding `isAdmin: true` to a participant document.
4. **ID Poisoning**: Using a 2KB string as a `participantId`.
5. **Relational Break**: Creating a `SAPI` participant with a non-existent `groupId`.
6. **Capacity Breach**: Adding an 8th participant ID to a `QurbanGroup`.
7. **Immutable Violation**: Attempting to change `type` (Kambing -> Sapi) after creation.
8. **PII Leak**: Querying for all participants with `whatsapp` visible to non-admins.
9. **Status Shortcut**: Updating status from `PENDING` directly to `PAID` without `VERIFYING` (if logic requires sequence).
10. **Resource Exhaustion**: Sending a participant name with 1MB of text.
11. **Timestamp Spoofing**: Setting `createdAt` to a future date.
12. **Orphaned Write**: Creating a participant without updating the group's `participantIds`.

## Test Runner Plan
Generating `firestore.rules` that address these.
