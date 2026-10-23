
# TicketHub: Event Ticketing System Design

## 1. Requirements
**Functional Requirements:**
- Users can browse upcoming events and view available seats.
- Users can temporarily hold a seat while they complete payment.
- Users can pay for and confirm their order.
- Users can view their purchased tickets.

**Non-Functional Requirements:**
- **Speed:** Page loads and seat selection must respond in under 200ms.
- **Correctness:** The system must guarantee no double-booking (a seat cannot be sold to two people).
- **Fairness:** During high-demand sales, the system should handle requests in a fair, first-come-first-served manner.
- **Availability:** 99.9% uptime, even during normal browsing.

## 2. Load Estimates
We use the back-of-the-envelope rounding rule: 1 day ≈ 100,000 seconds.

**Normal Traffic:**
- 50,000 visitors/day × 10 pages = 500,000 reads/day.
- Reads per second: 500,000 ÷ 100,000 = **5 reads/sec**.
- 5,000 tickets sold/day.
- Writes per second: 5,000 ÷ 100,000 = **0.05 writes/sec**.

**"Big Sale" Peak Traffic (First 10 minutes = 600 seconds):**
- 200,000 users try to buy 20,000 seats.
- Assuming each user makes 5 requests (view event, view seats, attempt hold, pay, confirm): 1,000,000 total requests.
- Peak requests per second: 1,000,000 ÷ 600 seconds ≈ **1,666 requests/sec**.
- *Conclusion:* The big sale creates a massive, write-heavy spike (hundreds of writes/sec) compared to normal traffic. The system must be designed to survive this specific bottleneck.

## 3. API Design
1. `GET /events` - Browse all upcoming events. (200 OK)
2. `GET /events/{id}/seats` - View available seats for a specific event. (200 OK)
3. `POST /events/{id}/holds` - Temporarily hold a specific seat for 10 minutes. Returns a `hold_token`. (201 Created)
4. `POST /orders` - Confirm payment and convert a hold into a permanent order using the `hold_token`. (201 Created)
5. `GET /users/{id}/tickets` - View all purchased tickets for a user. (200 OK)

## 4. Data Model
**Entities & Relationships:**
- `users` (One) to `orders` (Many): A user can have many orders.
- `events` (One) to `seats` (Many): An event has many seats.
- `seats` (One) to `orders` (Many): A seat can be in many historical orders, but only one *active* order at a time.

**CREATE TABLE Statements:**
```sql
CREATE TABLE users (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE events (
  id    INTEGER PRIMARY KEY,
  name  TEXT NOT NULL,
  date  TEXT NOT NULL,
  venue TEXT NOT NULL
);

CREATE TABLE seats (
  id         INTEGER PRIMARY KEY,
  event_id   INTEGER NOT NULL,
  row_label  TEXT NOT NULL,
  seat_num   INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'held', 'sold')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE orders (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  seat_id    INTEGER NOT NULL UNIQUE, -- Prevents the same seat being in two active orders
  event_id   INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (seat_id) REFERENCES seats(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);

Preventing Double-Booking:
Double-booking is prevented using Database Transactions (ACID) and Constraints. When a user pays, the system runs a transaction: 
BEGIN TRANSACTION;
-- Only update if the seat is currently 'held' by this specific process
UPDATE seats SET status = 'sold' WHERE id = ? AND status = 'held';
UPDATE orders SET status = 'confirmed' WHERE seat_id = ? AND status = 'pending';
COMMIT;

The UNIQUE constraint on orders.seat_id and the WHERE status = 'held' condition ensure that if two users try to buy the same seat simultaneously, the database's isolation guarantees only one transaction will succeed, and the other will fail safely.

5. Architecture Diagram
                          ┌─────────┐
           ┌─────────────>│   DNS   │  
           │              └─────────┘
  ┌────────┴──────┐  static files   ┌──────────────────────┐
  │ Browser /     │ ──────────────> │ CDN (HTML, CSS, JS)  │
  │ mobile client │                 └──────────────────────┘
  └────────┬──────┘
           │ API calls (HTTPS)
           v
    ┌───────────────┐
    │ Load Balancer │ (with Rate Limiting to stop bots)
    └──────┬────────┘
      ┌────┴─────┬──────────┐
      v          v          v
   ┌───────┐  ┌───────┐  ┌───────┐      ┌──────────────┐
   │ App 1 │  │ App 2 │  │ App 3 │─────>│ Cache (Redis)│ (Event details, seat maps)
   └───┬───┘  └───┬───┘  └───┬───┘      └──────────────┘
       │ reads    │ holds    │ jobs
       v          v          v
   ┌──────────┐ ┌──────────┐ ┌───────┐    ┌──────────────────┐
   │ Read     │>| Primary  │ │ Queue │───>│ Worker           │
   │ Replicas │ |   DB     │ └───────┘    │ (Sends email     │
   └──────────┘ └──────────┘              │  tickets later)  │
                                          └──────────────────┘

                                  
Component Explanations:
CDN: Solves latency by serving static front-end files from edge servers close to the user.
Load Balancer: Solves the single point of failure by distributing API traffic across multiple app servers. It also enforces rate limiting to prevent abusive scripts from overwhelming the system.
App Servers: Stateless servers that handle business logic. Being stateless allows horizontal scaling.
Cache (Redis): Solves database overload during the "big sale" by serving read-heavy requests (like viewing the event page or seat map) from memory.
Primary DB: The single source of truth. All writes (holds, orders) go here to ensure strict ACID compliance and prevent double-booking.
Read Replicas: Handle the high volume of normal browsing traffic, copying data from the primary.
Message Queue & Worker: Solves the problem of slow tasks. After an order is confirmed in the DB, the app queues an "email ticket" job and replies to the user immediately, keeping the API fast.

6. Trade-offs
Consistency vs. Availability (CAP Theorem): During a big sale, we strictly prioritize Consistency (preventing double-booking) over Availability. If the primary database becomes overloaded, the system will return a "Please try again" error rather than risk selling the same seat twice. For a ticketing system, correctness is non-negotiable.
Speed vs. Fairness: To ensure fairness and protect the database from 1,666 requests/sec, we could introduce a virtual "waiting room" queue. This trade-off intentionally adds latency to guarantee a first-come-first-served order and prevent the system from crashing under the spike.