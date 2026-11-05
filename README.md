# iMessage Pro - Enterprise Real-Time Messaging Platform

A high-performance, real-time messaging application inspired by WhatsApp and Apple iMessage, built with **React**, **Tailwind CSS**, **Node.js**, **Socket.io**, and **Redis Pub/Sub** for horizontal multi-container scaling.

---

## 🚀 Key Architectural Highlights

### 1. Scaling & DevOps (Docker & Redis Pub/Sub)
- **Multi-Container Horizontal Scaling**: Configured with Docker Compose spinning up multiple Express backend instances (`backend1:5000` and `backend2:5001`) bridged by `@socket.io/redis-adapter` over **Redis Pub/Sub**. Messages sent to any backend instance are seamlessly broadcast across all active WebSocket connections.
- **Docker Compose Orchestration**: Includes `redis:alpine`, `mongo:8`, scaled Node.js express backends, and an Nginx-powered production frontend container.

### 2. AI Copilot & Smart Replies
- **Contextual Copilot Toggle**: Floating toggle button to enable/disable AI suggestions.
- **Dynamic Quick-Reply Pills**: Context-aware 1-click reply suggestions generated from thread messages.
- **"Catch Me Up" Intelligent Thread Summarization**: Modal summarizing discussion context into an Executive TL;DR, key discussion highlights, and action items.
- **REST API Endpoint (`/api/ai/copilot`)**: Connects directly to local LLMs (such as Ollama running in Docker) or cloud AI APIs with a built-in deterministic NLP fallback engine.

### 3. Rich Collaboration & Security
- **End-to-End Encryption (E2EE)**: Client-side cryptographic operations via the standard **Web Crypto API**:
  - **Key Exchange**: ECDH (Elliptic Curve Diffie-Hellman) using NIST `P-256` curve.
  - **Symmetric Cipher**: `AES-GCM 256-bit` with random 96-bit IVs.
  - Servers only receive and persist ciphertext; encryption keys never leave the client browser.
- **Interactive Code Snippet Sharing**: Dedicated modal supporting syntax formatting for JavaScript, Python, Dockerfile, Docker Compose YAML, TypeScript, HTML/CSS, SQL, Shell/Bash, Go, and Rust with one-click clipboard copying.
- **Media & Voice Notes**: Asynchronous background queue powered by **BullMQ** for handling voice note transcriptions and media optimization.

### 4. Offline-First Architecture
- **IndexedDB Local Storage**: Powered by `idb` to persist messages and conversation threads locally on the client.
- **Automatic Outbox Queue**: Outgoing messages sent while disconnected from the network are auto-queued with status `queued` in IndexedDB, and automatically flushed and delivered as soon as network or WebSocket connectivity resumes.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS, Vite, Web Crypto API, IndexedDB (`idb`), Socket.io Client.
- **Backend**: Node.js, Express, Socket.io, `@socket.io/redis-adapter`, ioredis, BullMQ, Mongoose, Multer.
- **Containers**: Dockerfile (Multi-stage Node & Nginx), `docker-compose.yml` (Redis, MongoDB, Backend 1, Backend 2, Frontend).

---

## 🏃 Running the Application

### Option A: Running with Docker Compose (Recommended)

1. Ensure Docker Desktop is running on your machine.
2. Clone and start the containers:
```bash
docker-compose up --build
```
3. Open your browser:
   - **Frontend Application**: [http://localhost:5173](http://localhost:5173)
   - **Backend Primary (Instance 1)**: [http://localhost:5000/health](http://localhost:5000/health)
   - **Backend Scaled (Instance 2)**: [http://localhost:5001/health](http://localhost:5001/health)
   - **Redis Pub/Sub**: `localhost:6379`
   - **MongoDB**: `localhost:27017`

---

### Option B: Running Locally (Development Mode)

#### 1. Start the Backend
```bash
cd Backend
npm install
node src/index.js
```
*Backend will run on `http://localhost:5000` (or `http://localhost:3000`). If Redis or MongoDB are not running, it automatically switches to local in-memory fallback mode.*

#### 2. Start the Frontend
```bash
cd Frontend
npm install
npm run dev
```
*Frontend will launch at `http://localhost:5173`.*

---

## 🧪 Integration Testing Suite

Verify the full stack (WebSocket multi-client sync, E2EE ciphertext exchange, typing indicators, AI Copilot, and BullMQ queues) by executing:

```bash
cd Backend
node test-integration.js
```

---

## 🔒 Security Model

```
[Browser Client A] ──(Web Crypto ECDH + AES-GCM)──> [Ciphertext + IV]
                                                            │
                                                     [Express Server]
                                                            │
                                              [Redis Pub/Sub Adapter]
                                                            │
[Browser Client B] <──(Decrypt via Shared Key)────── [Ciphertext + IV]
```
The server functions purely as a blind ciphertext router and never retains or inspects plaintext or private keys.
