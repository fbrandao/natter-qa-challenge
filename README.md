# 🧪 Natter QA Challenge

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io/)
[![Made with Playwright](https://img.shields.io/badge/tested%20with-Playwright-45ba63.svg?logo=playwright)](https://playwright.dev/)
[![Artillery](https://img.shields.io/badge/load%20tested%20with-Artillery-ff69b4.svg?logo=artillery)](https://artillery.io/)

A modern end-to-end testing framework for WebRTC applications, built with **Playwright + TypeScript** and **Artillery** for performance testing. The framework uses the **Page Object Model (POM)** design pattern to validate WebRTC video calls with scalability, reliability, and maintainability in mind.

> **Important Note**: Due to credential constraints, all tests must use the same single call credentials. This means all users join the same call, making proper session management and cleanup crucial for test reliability.

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
  private videoFiles: string[];

  constructor(browserType: BrowserType, config: CallConfig) {
    // Single call configuration shared across all users
    this.config = {
      appId: process.env.AGORA_APP_ID,
      token: process.env.AGORA_TOKEN,
      channel: process.env.AGORA_CHANNEL,
      ...config
    };
    
    this.videoFiles = [
      '/videos/randomUsers/salesman_qcif.y4m',
      '/videos/randomUsers/sign_irene_qcif.y4m',
      '/videos/randomUsers/silent_qcif.y4m',
      '/videos/randomUsers/suzie_qcif.y4m',
    ];
  }

  async newCall(config?: CallConfig): Promise<Call> {
    // All calls use the same credentials
    const call = new Call(this.browserType, this.config, this.getRandomVideoFilePath);
    this.calls.push(call);
    return call;
  }

  createUsers(count: number, baseName = 'User'): User[] {
    return Array.from({ length: count }, (_, i) => ({
      userId: faker.number.int({ min: 10000, max: 99999 }),
      testUserName: `${baseName}${i + 1}`,
      videoPathOverride: this.getRandomVideoFilePath(),
    }));
  }

  async cleanup(): Promise<void> {
    // Critical: Ensure all users leave the call
    this.logger.header(`Starting cleanup of ${this.calls.length} calls`);
    const callsToCleanup = [...this.calls];
    for (const call of callsToCleanup) {
      try {
        this.logger.debug('Cleaning up call...');
        await call.cleanup();
        this.logger.debug('Call cleanup complete');
      } catch (error) {
        this.logger.error('Error during call cleanup:', error);
      }
    }
    this.calls = [];
    this.logger.info('All calls cleaned up');
  }
}
```

### ✅ Call Management

Each call instance manages its own lifecycle and user sessions. Since all users join the same call, proper cleanup is essential:

```ts
class Call {
  private users: User[] = [];
  private browserContext: BrowserContext;

  async addUser(user: User): Promise<UserSession> {
    // All users join the same call with shared credentials
    const session = new UserSession(this.browserContext, user);
    await session.initialize();
    this.users.push(user);
    return session;
  }

  async cleanup(): Promise<void> {
    // Ensure all users leave before closing
    await Promise.all(this.users.map(user => user.cleanup()));
    await this.browserContext.close();
  }
}
```

### ✅ Video File Management

The framework uses a collection of pre-recorded video files to simulate real users. Since all users are in the same call, we use different video files to simulate various user behaviors:

1. **Video Files**:
   - Located in `videos/randomUsers/`
   - Multiple video files for different scenarios
   - QCIF format for optimal performance
   - Various user behaviors (talking, signing, silent)

2. **Video Assignment**:
   - Random video assignment for users
   - Override capability for specific test cases
   - Automatic cleanup after tests

Example usage:
```ts
// Create a call with shared credentials
const call = await sessionManager.newCall();

// Create users that will join the same call
const users = sessionManager.createUsers(3, 'TestUser');
const user1 = await call.addUser(users[0]); // Gets random video
const user2 = await call.addUser({
  ...users[1],
  videoPathOverride: '/videos/randomUsers/salesman_qcif.y4m'
}); // Gets specific video

// Important: Clean up all users before test ends
await call.cleanup();
```

### ✅ Page Object Model (POM)

- Every page is encapsulated in a class
- Shared components are modularized
- Common base classes reduce duplication
- Fixture initialization for faster and cleaner test execution

Example usage:

```ts
// Page Object
class VideoCallPage extends BasePage {
  readonly joinButton = this.page.getByTestId('join-button');
  readonly leaveButton = this.page.getByTestId('leave-button');
  readonly localVideo = this.page.getByTestId('local-video');

  async joinCall(appId: string, token: string, channel: string, userId: string) {
    await this.joinButton.click();
    await this.expectSuccessAlert();
    await this.expectLocalVideoPlaying(1);
  }

  async leaveCall() {
    await this.leaveButton.click();
    await this.expectNoLocalVideoPlaying();
  }
}

// Example
test('should join and leave call successfully', async ({ page, videoCallPage }) => {
  await videoCallPage.joinCall(appId, token, channel, userId);
  await videoCallPage.leaveCall();
});
```

### ✅ Logging System

Uses Winston for structured logging with context awareness:

```ts
const logger = defaultLogger.withContext('VideoCall');

logger.header('Starting video call test');
logger.info('Joining call with user:', { userId });
logger.debug('Video state:', { isPlaying: true });
logger.error('Call failed:', error);
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

Example:
```ts
test('should join call and play local video', async ({ page, videoCallPage }) => {
  await videoCallPage.joinCall(appId, token, channel, userId);
  await videoCallPage.expectLocalVideoPlaying(1);
  await videoCallPage.expectSuccessAlert();
});
```

#### 2. Multi-User Tests
- Multiple concurrent users
- User session management
- Video grid layout
- User presence indicators
- Chat functionality

Example:
```ts
test('should handle multiple users in call', async ({ sessionManager }) => {
  const call = await sessionManager.newCall();
  const user1 = await call.addUser(users.Alice);
  const user2 = await call.addUser(users.Bob);
  
  await user1.ui.expectRemoteVideoPlaying(1);
  await user2.ui.expectRemoteVideoPlaying(1);
});
```

#### 3. Visual Regression Tests
- UI component snapshots
- Layout verification
- Responsive design checks
- Visual state validation

Example:
```ts
test('should match video call UI snapshot', async ({ page, videoCallPage }) => {
  await videoCallPage.joinCall(appId, token, channel, userId);
  await expect(page).toHaveScreenshot('video-call-ui.png');
});
```

### 🔹 Performance Test Categories

- **Load Testing**:
  - Concurrent user simulation
  - WebRTC metrics collection
  - Performance thresholds
  - Resource utilization

- **Stress Testing**:
  - Maximum user capacity
  - Network condition simulation
  - Error recovery
  - System stability

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

- **Functional Tests**: Generated in `reports/e2e`
  - HTML reports
  - JSON results
  - Test traces
  - Visual comparison diffs

- **Performance Tests**: Generated in `reports/performance/`
  - Json reports from artillery

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