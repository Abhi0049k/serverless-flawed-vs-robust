# Pipeline Testing Frontend

This directory contains a lightweight React application built with Vite and TypeScript. It serves as a visual client and load-testing tool intended to interact with the AWS Serverless Data Pipelines in this activity.

## Why this Frontend Exists
Testing serverless pipelines via terminal commands (like `curl`) is useful for single event tests, but it is difficult to manually simulate the rapid, concurrent traffic necessary to expose architectural flaws like synchronous bottlenecks or concurrency limits. 

This frontend was built to solve that limitation. It provides an intuitive interface to:
1. Easily send single requests to test basic endpoint connectivity.
2. Use the "Mass Send" feature to instantly spam the API Gateway with dozens of concurrent requests.

## How It Is Used in this Activity

The frontend is used in two distinct phases to compare pipeline architectures:

### Phase 1: Exposing the Flawed Pipeline
1. You deploy the **flawed pipeline** and copy its API Gateway URL.
2. You configure this frontend to point to that URL.
3. You trigger mass requests from the frontend while watching the AWS CloudWatch logs in your terminal (`sam logs`).
4. This allows you to visually observe the intentional flaws occurring in real-time, such as 30% failure rates, random timeouts, and permanent message dropping due to the lack of a Dead-Letter Queue.

### Phase 2: Verifying the Correct Pipeline
1. You deploy the **correct pipeline** and copy its new API Gateway URL.
2. You update this frontend's configuration to point to the new URL and restart the frontend server.
3. You trigger the same mass requests from the frontend while watching the logs for the new consumer Lambda.
4. This allows you to verify that the robust pipeline successfully handles the exact same load using efficient Batching, an active Dead-Letter Queue (DLQ), and Idempotency checks.

---

## Getting Started

### 1. Configuration
Before running the app, it needs to know where your AWS pipeline lives. 
1. Create a `.env` file in the root of this `frontend` directory (you can copy `.env.example`).
2. Paste the URL provided by your `sam deploy` output:
   ```env
   VITE_API_GATEWAY_URL=https://<your-api-id>.execute-api.<region>.amazonaws.com/Prod/process
   ```

### 2. Running Locally
This project uses `yarn` as its package manager.
```bash
# Install dependencies
yarn install

# Start the Vite development server
yarn dev
```
The application will be available in your browser at `http://localhost:5173`. 

*(Note: If you change the URL in the `.env` file to switch between the flawed and correct pipelines while the server is running, you must restart the frontend server for Vite to process the new environment variable).*
