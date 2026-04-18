# Deployment Guide & Architecture Breakdown (Robust Pipeline)

This guide explains the architecture defined in your `template.yaml` and provides the exact commands you need to deploy the fully corrected, production-ready services to AWS.

## 1. Architecture Breakdown (`template.yaml`)

To understand the robust infrastructure, here is a breakdown of the components defined in the `template.yaml` file:

- **Globals > Api > Cors:** We enabled Cross-Origin Resource Sharing (CORS) allowing your React frontend browser application to connect and send data securely.
- **RobustQueueDLQ (`AWS::SQS::Queue`):** The Dead-Letter Queue. This acts as a safety net. If a message absolutely refuses to process successfully after multiple retries, it lands here instead of being lost forever.
- **RobustQueue (`AWS::SQS::Queue`):** The central Message Broker. It buffers incoming traffic to protect the downstream consumer. It is configured with a `RedrivePolicy` that routes messages to the DLQ after 3 failed processing attempts.
- **ProducerFunction:** This Lambda function bridges the API Gateway to SQS. When your frontend sends a POST request, this function grabs the payload and swiftly forwards it into the `RobustQueue`, immediately responding with a 200 OK so the user is never kept waiting.
- **RobustPipelineFunction:** Your primary data processor (`src/app.py`). It is triggered by SQS in highly efficient chunks (`BatchSize: 10`). It has a healthy 30-second timeout, securely tracks duplicate messages via Idempotency checking, and smartly returns partial batch failures (`ReportBatchItemFailures`) so AWS only retries the exact items that failed, not the whole batch!

---

## 2. Deployment Commands

Since you will be running the commands yourself, open your terminal in the `correct-pipeline` directory and run the following in order.

### Step 1: Build the Application

This command tells AWS SAM to read your `template.yaml` and download/compile the necessary dependencies.

```bash
sam build
```

### Step 2: Deploy to AWS

This command packages the built application and uses AWS CloudFormation to create all the resources safely in the cloud.

If you are running this for the first time or want to adjust configurations, use the `--guided` flag:

```bash
sam deploy --guided
```

**Important Prompts during `sam deploy --guided`:**
- **Stack Name:** `correct-pipeline`
- **AWS Region:** Choose your preferred region (e.g., `us-east-1`).
- **Confirm changes before deploy:** `y`
- **Allow SAM CLI IAM role creation:** `y` (it needs this to automatically generate permissions linking the Queues to the Lambdas).
- **Disable rollback:** `N`
- **ProducerFunction potentially may not have authorization defined, Is this okay?:** `y` (We are deliberately leaving it open so your React frontend can test it easily).

### Step 3: Get your API Endpoint

Once the deployment finishes, SAM will print out an `Outputs` table. Look for the key `ProducerApiUrl`. 
Simply paste this URL into your `frontend/.env` file (`VITE_API_GATEWAY_URL`), restart your frontend server, and begin testing the robust data flow!
