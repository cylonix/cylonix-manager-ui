# Cylonix Manager UI

This is the UI service code for the Cylonix Secure Network Access Manager, providing a modern web interface for the Cylonix controller. It's built with Vue 3 and Vuetify 3, offering a responsive and feature-rich user experience for managing your Cylonix infrastructure.

## 📋 Overview

This application interfaces with multiple Cylonix backend components via their respective APIs:

- **Cylonix Manager API**: Core management functionality
- **Cylonix Supervisor API**: System supervision services for Cylonix WireGuard Gateways, Cilium Firewalls and VPP routers.
- **Headscale API**: Network mesh control (Cylonix's fork of Headscale)

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- Git
- Docker (for containerized deployment)

### Initial Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/cylonix/cylonix-manager-ui.git
   cd cylonix-manager-ui
   ```

2. Initialize API submodules:

   ```bash
   git submodule update --init --recursive
   ```

3. Generate API clients:

   ```bash
   make generate
   ```

4. Configure environment:

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` to set the appropriate API endpoints for your environment.

### Development Server

To run the development server:
Note a local server may not work with remote cylonix-manager as the
redirect endpoint for oauth providers like google signin. You can use
an email and password login test account to test instead.

```bash
make dev
```

This will:

- Install dependencies
- Start the development server at [http://localhost:3030](http://localhost:3030)

### Building for Production

To build the project for production:

```bash
make build
```

### Docker Deployment

To build and tag Docker images:

```bash
make docker
```

This creates Docker images with the following tags:

- `cylonix/cylonix-manager-ui:${VERSION}`
- `cylonix/cylonix-manager-ui:${RELEASE}`
- `cylonix/cylonox-manager-ui:latest`

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `make dev` | Installs dependencies and starts development server |
| `make build` | Builds the application for production |
| `make docker` | Creates Docker images |
| `make generate` | Generates all API clients |
| `make supervisor-api` | Generates only Supervisor API client |
| `make manager-api` | Generates only Manager API client |
| `make headscale-api` | Generates only Headscale API client |
| `make version` | Updates version information |
| `make report` | Generates build reports |

## ⚙️ Configuration

The application can be configured through environment variables in `.env.local`:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BASE_URL` | Base URL for the application | `/manager/v2` |
| `VITE_SERVER_PORT` | Port for the development server | `3030` |
| `VITE_MANAGER_API_TARGET_URL` | URL for Manager API | `https://manage.cylonix.io/` |
| `VITE_MANAGER_VPN_API_TARGET_URL` | URL for VPN API | `https://manage.cylonix.io/vpn` |
| `VITE_METRICS_TARGET_URL` | URL for Metrics API | `https://manage.cylonix.io/metrics` |
| `VITE_WS_TARGET_URL` | URL for WebSocket connections | `https://manage.cylonix.io/` |
| `VITE_WS_URL` | WebSocket URL for alerts | `ws://localhost:3030/ws/log/v1/alert` |
| `VITE_LOGIN_REDIRECT_BASE_URL` | OAuth redirect URL | `http://localhost:3030/oauth-success` |
| `VITE_USE_MD3` | Flag to use Material Design 3 | `true` |

## ✨ Features

- 🖼️ **Modern UI**: Built with Vue 3 and Vuetify 3 for a responsive and intuitive interface
- 🔒 **Secure Access Management**: Complete control over your SASE infrastructure
- 📊 **Dashboard & Metrics**: Real-time visibility into your network performance
- 🔄 **State Management**: Uses Pinia for efficient state handling
- 🌐 **Network Control**: Integration with Headscale for mesh network management
- 🚀 **Fast Development**: Powered by Vite for quick builds and hot module replacement
- 📱 **Responsive Design**: Works on desktop and mobile devices

## 📦 Technology Stack

- **Frontend Framework**: Vue 3
- **UI Library**: Vuetify 3
- **State Management**: Pinia
- **Router**: Vue Router
- **API Clients**: Generated TypeScript-Axios clients
- **Build Tool**: Vite
- **Type Checking**: TypeScript
- **Code Editor**: Monaco Editor integration
- **Charting**: ECharts

## 📄 License

[BSD 3-Clause License](./LICENSE)

Copyright (c) 2025 EZBLOCK INC. & AUTHORS.
