# Serverless Pipeline Showdown: Flawed vs. Robust

Welcome to the ultimate AWS Serverless Pipeline comparison! 

This educational project was built to vividly demonstrate exactly **what goes wrong when you build cloud architecture poorly**, and **how to build it like a professional engineer.**

Instead of just reading about AWS best practices, this repository contains three interactable components that let you *feel* the difference by firing live data into the cloud and watching it either collapse or succeed!

## 📊 By The Numbers: The Performance Leap

Here is the explicit difference our architectural refactoring achieved:

- **Data Retention:** Improved from **< 60%** to **100%**
  - *Flawed:* Routinely loses over 30% of incoming data to application crashes, and drops even more to silent timeouts. 0% of failed data is recoverable.
  - *Robust:* Zero data loss. 100% of messages are processed or safely captured in the Dead-Letter Queue.
- **Throughput Efficiency:** Improved by **1,000% (10x)**
  - *Flawed:* Processes 1 single message per Lambda execution.
  - *Robust:* Processes up to 10 messages concurrently per execution, drastically reducing AWS compute costs.
- **Duplicate Data Errors:** Reduced from **100% vulnerable** to **0%**
  - *Flawed:* Blindly processes every duplicate message SQS accidentally sends.
  - *Robust:* Idempotency caching catches and skips 100% of duplicate `messageId` deliveries.

---

## 📂 Project Structure

This repository is split into three main components:

### 1. The Flawed Pipeline (`/flawed-pipeline`)
This folder contains an AWS Serverless Application (built with AWS SAM) that is **intentionally designed to fail.** 
It features classic anti-patterns:
- **Synchronous Bottlenecks:** It processes items one at a time (`BatchSize: 1`).
- **Data Loss:** It completely lacks a Dead-Letter Queue (DLQ), meaning any failed orders silently vanish into the ether.
- **Flaky Execution:** The code has an artificial 30% crash chance and random delays that constantly trip AWS's hard timeouts.
- **No Idempotency:** It blindly processes duplicate messages.

### 2. The Robust Pipeline (`/correct-pipeline`)
This folder contains the **exact same pipeline**, completely refactored with production-grade AWS practices.
- **High-Throughput Batching:** Safely processes 10 messages at once.
- **Fault Tolerant (Partial Failures):** If 1 item in a batch of 10 crashes, it uses `batchItemFailures` to only retry that single broken item!
- **Data Safety (DLQ):** Failed messages are gracefully routed to a dedicated Amazon SQS Dead-Letter Queue for human review.
- **Strict Idempotency:** Implements basic caching to identify and ignore duplicate messages.

### 3. The React Frontend (`/frontend`)
You can't test a pipeline without traffic! We built a local React application powered by Vite to act as our load-testing tool. 
It features a "Mass Send" feature designed to spam 100 toy orders into your API Gateway within seconds.

---

## 🚀 How to Experience the Comparison

### Phase 1: Break the Flawed Pipeline
1. Navigate into `flawed-pipeline` and deploy it to your AWS account (`sam build && sam deploy --guided`).
2. Copy the resulting `ProducerApiUrl` and paste it into the React Frontend's `.env` file.
3. Open two terminal windows: one running the React Frontend (`yarn dev`), and one running the live Lambda logs (`sam logs -n FlawedPipelineFunction --tail`).
4. **Spam the frontend.** Watch as the tiny timeouts and synchronous bottleneck cause your CloudWatch logs to explode with `Task timed out` and `Intentional Crash` errors, permanently losing data!
5. Delete the broken infrastructure (`sam delete`).

### Phase 2: Watch the Robust Pipeline Shrug it Off
1. Navigate into `correct-pipeline` and deploy it (`sam build && sam deploy --guided`).
2. Paste the new `ProducerApiUrl` into the React Frontend's `.env` file and restart the local server.
3. Open the live Lambda logs (`sam logs -n RobustPipelineFunction --tail`).
4. **Spam the frontend again.** Watch in awe as SQS safely buffers the massive incoming traffic, perfectly batches them into blocks of 10, identifies duplicates, and gracefully processes every single order without breaking a sweat.

---

## Prerequisites
To deploy and run this project, you will need:
- macOS / Linux / Windows WSL
- Node.js & Yarn (for the frontend)
- Python 3.12 (for the backend Lambdas)
- [AWS CLI](https://aws.amazon.com/cli/) configured with an active IAM user
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
