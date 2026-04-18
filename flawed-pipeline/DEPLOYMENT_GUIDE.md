# Deployment Guide & Architecture Breakdown

This guide explains the architecture defined in your `template.yaml` and provides the exact commands you need to deploy the services to AWS.

## 1. Architecture Breakdown (`template.yaml`)

To understand what is happening, here is a breakdown of the components defined in the `template.yaml` file:

- **Globals > Api > Cors:** We enabled Cross-Origin Resource Sharing (CORS). Because you eventually want to connect a web frontend to this, CORS is required so the browser doesn't block the frontend's API calls.
- **FlawedQueue (`AWS::SQS::Queue`):** This is the central Queue. As designed for this project, it is INTENTIONALLY FLAWED because it lacks a Dead Letter Queue (DLQ). Failed messages will eventually just expire and disappear into the void.
- **ProducerFunction:** This is a new Lambda function bridging the API Gateway to SQS. When your frontend sends a POST request, this function executes (`src/producer.py`), grabs the payload, and forwards it into the SQS `FlawedQueue`.
- **FlawedPipelineFunction:** Your original Lambda function (`src/app.py`). It is now configured to trigger automatically whenever new messages arrive in the SQS Queue. It processes exactly 1 message at a time (`BatchSize: 1`) and still has the intentional flaws (random crashing, no idempotency, and a very short 3-second timeout).

---

## 2. Deployment Commands

Since you will be running the commands yourself, open your terminal in the `flawed-pipeline` directory and run the following in order.

*Note: You mentioned using `uv` to run Python scripts. The AWS SAM CLI handles its own Python builds internally using `requirements.txt`, so you don't need to manually invoke `uv` for the deployment process itself. However, if you write any local test scripts to trigger AWS services from your machine, you should use `uv run <script>.py`.*

### Step 1: Build the Application

This command tells AWS SAM to read your `template.yaml` and download/compile necessary dependencies into a deployment-ready bundle.

```bash
sam build
```

### Step 2: Deploy to AWS

This command packages the built application, uploads it to AWS, and uses AWS CloudFormation to create all the resources (the API Gateway, SQS Queue, and both Lambda Functions). 

Using the `--guided` flag will take you through an interactive prompt. You can press **Enter** to accept the defaults for most of the prompts.

```bash
sam deploy --guided
```

**Important Prompts during `sam deploy --guided`:**
- **Stack Name:** `flawed-pipeline` (or anything you prefer).
- **AWS Region:** Choose your preferred region (e.g., `us-east-1` or `ap-south-1`).
- **Confirm changes before deploy:** `Y`
- **Allow SAM CLI IAM role creation:** `Y` (it needs this to let your Lambda write to SQS).
- **Disable rollback:** `N`
- **ProducerFunction potentially may not have authorization defined, Is this okay?:** `Y` (We are deliberately leaving it open so your frontend can test it easily).

### Step 3: Get your API Endpoint

Once the deployment finishes, SAM will print out an `Outputs` table. Look for the key `ProducerApiUrl`. This is the HTTP POST URL your frontend will use to send data into your pipeline! Keep this URL handy for when we build the frontend.
