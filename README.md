# Agora MCP

Agora is a decentralized commerce network designed to bridge the gap between AI agents and independent merchants. It serves as a universal aggregation layer that translates natural language and intent from AI models into standardized API transactions for independent e-commerce storefronts.

## Overview

The internet is composed of tens of thousands of independent e-commerce stores, each with its own unique API structure, authentication method, and data format. It is unscalable for AI agents to write custom integration code for every individual merchant.

Agora solves this problem through a two-sided architecture:

1. **Zero-Code Merchant Onboarding**: Merchants can register their existing search, product, and fulfillment APIs directly into the Agora network without writing any new code. The Agora gateway maps their unique data schema into a universal protocol.
2. **Universal MCP Connector**: AI platforms (such as Claude Desktop) can add a single Model Context Protocol (MCP) connector to their environment. This single integration grants the agent instant access to search, shop, and execute transactions across the entire decentralized network of onboarded merchants.

## Architecture

The project consists of three primary components:

### 1. Agora Gateway Backend (`agora-gateway/backend`)
A Node.js/Express server that acts as the core router and Model Context Protocol (MCP) server. 
- Serves the MCP Tools (`search_network`, `execute_settlement`, `track_order`, etc.) over Stdio or HTTP.
- Manages the SQLite database of registered merchants and their API mappings.
- Handles Cryptographic Mandate generation and acts as an escrow verification layer via Razorpay.

### 2. Agora Frontend (`agora-gateway/frontend`)
A React (Vite) frontend with a brutalist design aesthetic. 
- Provides the interface for Enterprise and SMB merchants to onboard their APIs.
- Hosts the Network Directory displaying currently registered merchants.
- Renders the user-facing Mandate Approval screen for cryptographic checkout validation.

### 3. Dummy Stores (`dummy-stores/`)
A collection of headless Node.js merchant backends (e.g., Electronics Store, Game Vault Store) used to demonstrate the zero-code onboarding and dynamic routing capabilities of the network.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for the backend and start the server:
   ```bash
   cd agora-gateway/backend
   npm install
   npm run dev
   ```
3. Install dependencies for the frontend and start the dev server:
   ```bash
   cd agora-gateway/frontend
   npm install
   npm run dev
   ```
4. Start a dummy merchant (optional, for testing):
   ```bash
   cd dummy-stores/game-vault-store
   npm install
   npm start
   ```

## Design Philosophy

The network is built with a focus on trust and agency. AI agents are empowered to navigate, discover, and build shopping carts autonomously, but financial execution is heavily safeguarded. The protocol utilizes a "Cryptographic Mandate" system, ensuring that an agent cannot execute a financial transaction without explicit human-in-the-loop validation and cryptographic signature verification.
