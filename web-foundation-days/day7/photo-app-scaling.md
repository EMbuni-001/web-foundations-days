
# Scaling Plan

## 1. Assumptions and Estimations

### 1.1 Assumptions Used
Application of rounding rules for back-of-the-envelope estimation:
- 1 day ≈ 100,000 seconds.
- 1 KB = 1,000 bytes; 1 MB = 1,000 KB; 1 GB = 1,000 MB; 1 TB = 1,000 GB.
- Peak traffic is approximately 5× the average traffic.

### 1.2 Working Out the Daily Active Users
- **Registered users:** 10,000,000
- **Daily Active Users (DAU):** 10% of 10,000,000 = **1,000,000 users/day**
- **Uploads per day:** 1,000,000 users × 1 photo = 1,000,000 uploads/day
  - **Average uploads/sec:** 1,000,000 ÷ 100,000 = **10 uploads/sec**
  - **Peak uploads/sec (5×):** **50 uploads/sec**
- **Feed views per day:** 1,000,000 users × 50 views = 50,000,000 views/day
  - **Average views/sec:** 50,000,000 ÷ 100,000 = **500 views/sec**
  - **Peak views/sec (5×):** **2,500 views/sec**
- **Storage per day:** 1,000,000 photos × (2 MB photo + 0.05 MB thumbnail) = 2,050,000 MB ≈ 2,050 GB (or ~2 TB) per day.
- **Storage per year:** 2,050 GB × 365 days ≈ **748,250 GB (or ~748 TB) per year**.

## 2. Read-Heavy vs. Write-Heavy
The system is heavily **read-heavy**. At peak, there are ~2,500 feed views (reads) per second compared to only 50 uploads (writes) per second. This is a 50-to-1 ratio. 
**What this means for design:** Optimise for fast reads. This can be done by safely using caching and database read replicas to handle the high volume of feed views, ensuring the primary database is not overwhelmed by read traffic.

## 3. Why Not Store Photos in the Database?
Databases are designed to store structured data and relationships quickly, not large files. Storing 2 MB photos directly in the database would make it enormous, slow down backups and waste expensive database memory. 
**Where they should go instead:** Photos and thumbnails should be stored in **File or Object Storage** (like Amazon S3). The database should only store the text metadata (e.g., user ID, caption, timestamp) and the URL link to the image in object storage.

## 4. Architecture Diagram
Text diagram 
┌─────────┐
┌─────────────>│ DNS │ (snapshare.com → IP addresses)
│ └─────────┘
┌────────┴──────┐ static files ┌──────────────────────┐
│ Browser / │ ──────────────> │ CDN (HTML, CSS, JS) │
│ mobile client │ └──────────────────────┘
└────────┬──────┘
│ API calls (HTTPS, JSON)
v
┌───────────────┐
│ Load Balancer │
└──────┬────────┘
┌────┴─────┬──────────┐
v v v
┌───────┐ ┌───────┐ ┌───────┐ ┌──────────────┐
│ App 1 │ │ App 2 │ │ App 3 │─────>│ Cache (Redis)│ (for frequent feed data)
└───┬───┘ └───┬───┘ └───┬───┘ └──────────────┘
│ writes │ reads │ jobs
v v v
┌─────────┐ ┌──────────┐ ┌───────┐ ┌──────────────────┐
│ Primary │>| Read │ │ Queue │───>│ Worker │
│ DB │ | replicas │ └───────┘ │ (creates thumbnails)
└─────────┘ └──────────┘ └────────┬─────────┘
v
┌──────────────┐
│ Object │
│ Storage (S3) │
└──────────────┘


## 5. Component Explanations (The Problem Each Solves)
- **CDN:** Solves high latency for static files by serving the front-end code from an edge server close to the user.
- **Load Balancer:** Solves the single point of failure and bottleneck of a single app server by distributing incoming API traffic across multiple healthy servers.
- **App Servers (Stateless):** Solve the need for horizontal scalability; because they hold no user state in memory, any server can handle any request.
- **Cache (Redis):** Solves database overload by storing frequently accessed feed data in fast memory, turning slow disk reads into millisecond cache hits.
- **Primary Database:** Solves the need for a single, consistent source of truth for all write operations (new uploads, new metadata).
- **Read Replicas:** Solve the read-heavy bottleneck by copying data from the primary and handling the high volume of feed view queries.
- **Message Queue:** Solves the problem of slow tasks blocking the user; it allows the app to queue a "create thumbnail" job and reply to the user immediately.
- **Worker:** Solves the problem of background processing by quietly pulling jobs from the queue and generating thumbnails without slowing down the main app.
- **Object Storage:** Solves the problem of storing massive binary files efficiently and cheaply, separate from the structured database.

## 6. Step-by-Step Upload Flow
1. The user's app sends the photo file and metadata (caption, etc.) to the **Load Balancer**.
2. The Load Balancer routes the request to an available, healthy **App Server**.
3. The App Server uploads the original photo file to **Object Storage** and receives a URL in return.
4. The App Server saves the photo metadata (including the Object Storage URL) to the **Primary Database**.
5. The App Server adds a "generate thumbnail" job to the **Message Queue**.
6. The App Server immediately replies to the user: "Upload successful!" (keeping latency low).
7. In the background, the **Worker** picks up the job from the queue, downloads the photo, creates the 50 KB thumbnail, saves it to **Object Storage**, and updates the **Primary Database** with the thumbnail URL.

## 7. Trade-offs
A key lesson take-away was that there is no perfect design, only the right design for the product's needs. Therefore, the four key trade-offs in this system are:
1. **Speed versus Freshness:** Caches and read replicas are fast but may show slightly old data (eventual consistency). For a photo feed, a few seconds of staleness is acceptable to keep the system fast.
2. **Simplicity versus Scalability:** Introducing a Message Queue and Worker adds operational complexity (another system to monitor). However, this trade-off is necessary because generating thumbnails is slow; doing it synchronously would create a bottleneck and ruin the user experience.
3. **Consistency versus Availability:** When parts of a system cannot communicate, you must choose between refusing requests (to stay correct) or answering with possibly outdated data (to stay online). Availability is favoured so users can always view their feed.
4. **Cost versus Reliability:** Adding extra app servers, read replicas, and CDN edge servers greatly improves uptime and handles peak traffic, but it costs significantly more money to run and maintain.

## 8. Future Scaling Considerations (Sharding & Microservices)
*Note: These are to be used only when truly needed. At ~750 TB/year and 2,500 peak reads/sec, the current design does not need them yet, but they are the next steps if the app grows to 100 million users.*
- **Sharding (Splitting):** If the primary database becomes too big or busy even with replicas, the data can be split across several databases (e.g., Users A-M on Shard 1, Users N-Z on Shard 2. Powerful but makes queries across shards complex.
- **Microservices:** Currently, the app servers run as a monolith. If it expands, it could be split into microservices. It allows each part to be scaled independently, but may add network complexity and make debugging harder.

