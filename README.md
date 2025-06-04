# 🧪 Natter QA Challenge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![Made with Playwright](https://img.shields.io/badge/tested%20with-Playwright-45ba63.svg?logo=playwright)](https://playwright.dev/)
[![Artillery](https://img.shields.io/badge/load%20tested%20with-Artillery-ff69b4.svg?logo=artillery)](https://artillery.io/)

A modern end-to-end testing framework for WebRTC applications, built with **Playwright + TypeScript** and **Artillery** for performance testing. The framework uses the **Page Object Model (POM)** design pattern to validate WebRTC video calls with scalability, reliability, and maintainability in mind.

> **Important Note**: Due to credential constraints, all tests must use the same single call credentials. This means all users join the same call, making proper session management and cleanup crucial for test reliability.

> **Bonus Feature**: The performance testing suite using Artillery was added as a bonus feature to demonstrate load testing capabilities. While not part of the core requirements, it showcases how to implement concurrent user simulation and performance monitoring in a WebRTC application.

---

## 📁 Project Structure

```
├── config/                 # Configuration files
│   ├── performance.ts     # Performance test configuration
│   └── ...
├── fixtures/              # Test fixtures and utilities
│   ├── pageFixtures.ts    # Page object fixtures
│   ├── sessionFixtures.ts # Session management fixtures
│   └── userFixtures.ts    # User management fixtures
├── pages/                 # Page Object Models
│   └── basicVideo/        # Video call page objects
├── tests/                 # Test suites
│   ├── functional/        # Functional tests
│   │   └── e2e/          # End-to-end tests
│   └── performance/       # Performance tests
├── utils/                 # Utility functions
│   ├── logger/           # Logging utilities
│   ├── session/          # Session management
│   └── healthCheck/      # Health check utilities
├── snapshots/            # Visual test snapshots
└── videos/               # Test video files
    └── randomUsers/      # Fake user video files
```

---

## 🧱 Architecture & Design

### ✅ Session Management

The framework uses a robust session management system to handle multiple concurrent calls and users. Due to credential constraints, all users must join the same call, making proper session management crucial:

```ts
class SessionManager {
  private calls: Call[] = [];
  
  async newCall(): Promise<Call> {
    const call = new Call(this.browserType, this.config);
    this.calls.push(call);
    return call;
  }

  async cleanup(): Promise<void> {
    await Promise.all(this.calls.map(call => call.cleanup()));
    this.calls = [];
  }
}
```

### ✅ Page Object Model (POM)

Every page is encapsulated in a class with shared components and common base classes:

```ts
class VideoCallPage extends BasePage {
  readonly joinButton = this.page.getByTestId('join-button');
  readonly localVideo = this.page.getByTestId('local-video');

  async joinCall(appId: string, token: string, channel: string, userId: string) {
    await this.joinButton.click();
    await this.expectLocalVideoPlaying(1);
  }
}
```

---

## 🧪 Testing Strategy

### 🔹 Functional Test Categories

#### 1. Single User Tests
- Basic video call operations
- Local video playback verification
- Media device permissions
- Error handling scenarios
- Call leaving behavior

#### 2. Multi-User Tests
- Multiple concurrent users
- User session management
- Video grid layout
- User presence indicators
- Chat functionality

#### 3. Visual Regression Tests
- UI component snapshots
- Layout verification
- Responsive design checks
- Visual state validation

### 🔹 Performance Test Categories

- **Load Testing**:
  - Concurrent user simulation
  - WebRTC metrics collection
  - Performance thresholds
  - Resource utilization

### 🔹 Features

- Isolated feature-based tests
- Full use of Playwright fixtures
- Dynamic test data generation
- Rich assertions & retries
- Structured logging
- Visual regression testing
- Snapshot comparison

---

## ⚙️ Configuration & Tooling

- **Framework**: Playwright + Artillery
- **Language**: TypeScript
- **Linter**: ESLint
- **Formatter**: Prettier
- **Logging**: Winston
- **Reports**: HTML, JSON, JUnit
- **Runner**: Playwright Test
- **Env**: `.env` files with environment variables
- **Visual Testing**: Playwright snapshots

---

## 🚀 Getting Started

### 1. 📦 Install Dependencies

```bash
npm install
```

### 2. ⚙️ Configure Environment Variables

Create a `.env` file in the **project root** with the following content:

```env
AGORA_APP_ID=your_app_id
AGORA_TOKEN=your_token
AGORA_CHANNEL=your_channel
ARTILLERY_API_KEY=your_artillery_key
```

### 3. 📌 Run Tests

```bash
# Run functional tests
npm run test:e2e           # Run all functional tests
npm run test:e2e:ui        # Run tests with UI
npm run test:e2e:headed    # Run tests in headed mode
npm run test:e2e:debug     # Run tests in debug mode
npm run test:e2e:update    # Update visual snapshots

# Run performance tests
npm run test:performance           # Run performance tests
npm run test:performance:record    # Run with recording
npm run test:performance:report    # Generate report
```

---

## 🧹 Code Quality

```bash
npm run lint         # Lint check
npm run lint:fix     # Fix linting issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

---

## 📊 Test Reports

### Functional Test Reports

- **Location:** `reports/e2e`
- **Formats:**
  - **HTML Report:** Rich, interactive UI for browsing test results.
  - **JSON & JUnit:** Machine-readable formats for CI integration.
  - **Visual Snapshots:** Screenshots and diffs for UI regression.
- **Automatic CI Summary:**
  - Uses [CTRF Reporter](https://www.npmjs.com/package/playwright-ctrf-json-reporter) to publish a summary directly in the GitHub Actions UI.
  - **Example:**  
    👉 [Live CTRF report in GitHub Actions](https://github.com/fbrandao/natter-qa-challenge/actions/runs/15437002379)

### Performance Test Reports

- **Location:** `reports/performance/`
- **Formats:**
  - **Artillery JSON:** Raw results for further analysis.
  - **Artillery HTML:** Visual summary generated with `artillery report`.
  - **Artillery Cloud Dashboard:** Shareable, interactive dashboards.
- **Example:**  
  👉 [Artillery Cloud Example Dashboard](https://app.artillery.io/share/sh_6df86d64045c731da42c4e9ea5a3d84275a681192712ef80eeb8909a8e97551b)

---

**How to view reports:**
- **Functional:**  
  - Open `reports/e2e/index.html` in your browser for the full Playwright HTML report.
  - View the CTRF summary directly in your [GitHub Actions run](https://github.com/fbrandao/natter-qa-challenge/actions).
- **Performance:**  
  - Run `npm run test:performance:report` to generate and open the Artillery HTML report.
  - Visit the Artillery Cloud dashboard link for interactive exploration.

---

## 🔍 Key Features

1. **WebRTC Testing**
   - Video call testing
   - Media device health checks
   - Session management
   - Error handling
   - Visual regression testing

2. **Performance Testing**
   - Load testing with Artillery
   - Custom metrics for WebRTC
   - Performance thresholds
   - Concurrent user simulation

3. **Logging System**
   - Structured logging with Winston
   - Context-aware logging
   - Multiple log levels
   - Rich metadata support

---

## 🔮 Future Improvements

### 🧪 Test Coverage

- Add more edge cases
- Implement stress testing
- Add network condition testing
- Enhance error scenarios

---

## 📝 License

This project is licensed under the [MIT License](LICENSE).