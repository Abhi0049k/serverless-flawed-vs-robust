# Robust Serverless Data Pipeline

This project is a production-ready, fault-tolerant implementation of an AWS serverless data pipeline. It resolves multiple critical anti-patterns found in the flawed version and implements robust AWS best practices for high-throughput, reliable data ingestion.

## Robust Design Features Implemented

This pipeline exhibits the following deliberate architectural improvements:

1. **Queue Buffering via SQS**: The API Gateway strictly talks to a Producer Lambda, which safely deposits the data into an Amazon SQS Queue (`RobustQueue`). SQS acts as a massive shock-absorber, protecting downstream resources from unexpected traffic spikes.
2. **Batch Processing**: The Consumer Lambda no longer reads messages 1-by-1. It is configured with `BatchSize: 10`, allowing it to process up to ten messages simultaneously in a single execution environment, significantly lowering AWS Lambda execution costs.
3. **Partial Batch Failures**: Standard SQS batching forces the *entire* batch to fail if just 1 item crashes. This architecture enables `ReportBatchItemFailures` so the Python code can gracefully declare exactly which individual item failed, preventing the unnecessary re-processing of successful data.
4. **Dead-Letter Queue (DLQ)**: An associated `RobustQueueDLQ` is active. If any data payload fails to process 3 times due to formatting errors or bugs, SQS automatically routes the poison-pill message to the DLQ instead of discarding it, so developers can inspect it manually later.
5. **Idempotency**: Because Amazon SQS uses "At-least-once" delivery, duplicate messages are possible. The `RobustPipelineFunction` tracks unique `messageId` execution in a cache, ensuring no duplicate data corrupts the system.
6. **Corrected Timeouts**: Timeouts are expanded to properly respect the SQS batch window constraints and expected execution workload.

## Prerequisites

- AWS CLI configured with active credentials
- [AWS SAM CLI installed](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- Python 3.12 active in your development environment
- A React frontend (provided in the `frontend` folder) for testing

## Deployment Instructions

1. Navigate to the `correct-pipeline` directory:
   ```bash
   cd correct-pipeline
   ```

2. Build the SAM application:
   ```bash
   sam build
   ```

3. Deploy the application to your AWS account using guided setup:
   ```bash
   sam deploy --guided
   ```
   *Follow the prompts and name the stack `correct-pipeline` to avoid collisions.*

4. Copy the Output `ProducerApiUrl` to map it into your React Frontend's `.env` configuration.

## Testing the Robustness

You can trigger the pipeline using the included graphical React frontend or via terminal:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORD-123", "item": "Dino Plush"}' \
  <YOUR_API_GATEWAY_URL>
```

### Try these scenarios to observe the success points:

1. **Spam the Endpoint:** Use your React frontend or a load testing tool to spam 100 requests in 2 seconds. The API Gateway will respond instantly with `200 OK` for all 100, and SQS will safely buffer them, allowing the Consumer Lambda to neatly chug through them 10 at a time without breaking a sweat!
2. **Review the Live Logs:** Open a secondary terminal to watch the smart processing happen live:
   ```bash
   sam logs -n RobustPipelineFunction --stack-name correct-pipeline --tail
   ```

## Cleaning Up

To delete the project safely and remove all AWS resources so you do not incur charges:

```bash
sam delete
```
