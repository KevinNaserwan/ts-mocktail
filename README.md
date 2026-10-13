# ts-mocktail 🍸

> **Zero-config TypeScript DTO/Interface contract-driven stateful HTTP mock server.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://img.shields.io/badge/Node.js-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](https://github.com/KevinNaserwan/ts-mocktail)

---

## 📌 Background & Motivation
In agile frontend and mobile application development, frontend engineers frequently experience blockers waiting for backend APIs to be designed, deployed, or seeded with realistic data. Conventional mocking approaches suffer from critical flaws:
1. **Manual Static JSON:** Tedious to write, static, lacks pagination or relational filtering, and quickly becomes outdated (*stale*) as models evolve.
2. **Mock Service Worker (MSW) Overhead:** Requires writing extensive handler code, route declarations, and synthetic fixture boilerplate for every single endpoint.

**`ts-mocktail`** provides a **zero-code, contract-driven mocking runtime**. You point it at your shared TypeScript models (`models.ts` or `api.dto.ts`), and it spins up a fully stateful, CORS-enabled REST API with pre-seeded data supporting realistic `GET`, `POST`, `PUT`, and `DELETE` requests in real time.

---

## ✨ Features

* **📜 Direct TypeScript AST Extraction:** Reads `.ts` files directly without requiring `ts-node` or complex compilation setups. Extracts interfaces, types, optional properties, and union string literals (`'ACTIVE' | 'PENDING'`).
* **🧠 Context-Aware Synthetic Data Generation:** Generates coherent, type-safe data matching field names (e.g., automatically generating realistic emails for `email`, names for `authorName`, and monetary values for `totalAmount`).
* **💾 In-Memory Stateful Mutation:** Unlike static mockers, mutations are stateful! If you send a `POST /user`, the newly created user is persisted and immediately retrievable via subsequent `GET /user` or `GET /user/:id`.
* **🌐 Universal CORS & REST:** Out-of-the-box support for Angular, React, Vue, Flutter, and iOS/Android HTTP clients.

---

## 🚀 Installation & Quick Start

### Global Installation
```bash
npm install -g ts-mocktail
# Or execute on-the-fly via npx:
npx ts-mocktail --help
```

### Spin Up Mock Server in 1 Command
Given a TypeScript definition file (`models.ts`):
```typescript
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'ENGINEER' | 'VIEWER';
  isActive: boolean;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  totalAmount: number;
}
```

Run:
```bash
ts-mocktail models.ts --port 4000
```

### Instant API Endpoints Available:
* `GET    /user` — Returns list of pre-seeded users.
* `GET    /user/:id` — Fetches specific user.
* `POST   /user` — Creates and persists a new user adhering to the `User` contract.
* `PUT    /user/:id` — Updates existing user fields.
* `DELETE /user/:id` — Removes user from state.
* `GET    /purchaseorder` — Full CRUD for Purchase Orders.

---

## 🧪 Testing & Verification

Run the test suite (unit + stateful HTTP E2E tests):
```bash
npm test
```

Run demo mode:
```bash
npm run demo
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

Authored with ❤️ by [Kevin Naserwan](https://github.com/KevinNaserwan).
