# Flawed Serverless Data Pipeline

This project is a conceptually flawed, intentionally broken implementation of an AWS serverless data pipeline. It contains multiple anti-patterns intended for learning and demonstration purposes of what *not* to do when building a production system.

## Design Flaws Demonstrated

This pipeline exhibits the following deliberate architectural and implementation flaws:

1. **Inefficient SQS Processing**: Although an SQS queue is utilized, the Lambda function is configured to process exactly 1 item at a time (`BatchSize: 1`). This completely defeats the high-throughput buffering advantages of queue architectures.
2. **Slow Execution & Improper Timeouts**: The code introduces an artificial processing delay. Coupled with a hardcoded timeout of 3 seconds in the `template.yaml`, this ensures the function frequently receives hard kills from AWS.
3. **No Dead-Letter Queue (DLQ)**: By omitting a DLQ, any failed process essentially vanishes into the ether.
4. **Improper Error Handling**: The script fails randomly 30% of the time, immediately dropping the payload.
5. **No Idempotency**: The application blindly processes payloads. If a message is sent twice, it is processed twice.
7. **No Reserved Concurrency**: No bounded concurrency limit is defined in the `template.yaml`. This can allow runaway parallel executions, potentially exhausting account-level concurrency limits and impacting other critical infrastructure within the same AWS account.

## Prerequisites

- AWS CLI already configured with Administrator permission
- [AWS SAM CLI installed](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- Python 3.12
- UV package manager (optional, but recommended per project defaults)

## Deployment Instructions

1. Build the SAM application:
   ```bash
   sam build
   ```

2. Deploy the application to your AWS account:
   ```bash
   sam deploy --guided
   ```
   *Follow the prompts (accepting the defaults is fine). When prompted about authorization for the API Gateway endpoint, answer 'y' to continue without authorization.*

3. The deployment output will provide the `FlawedPipelineApi` URL. This is the endpoint to invoke the intentionally buggy pipeline.

## Testing the Flaws (Usage)

To trigger the pipeline, send an HTTP POST request to the provided endpoint URL in the SAM output:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"data": "test payload 1"}' \
  <YOUR_API_GATEWAY_URL>
```

### Try these scenarios to observe the failure points:

1. **Observe Random Failures:** Send multiple requests. Approximately 30% of them will throw an `Internal Server Error` (502 from API Gateway on Lambda exception). The payload simply disappears.
2. **Observe Timeouts:** Due to the artificial delay (2-5s) clashing with the (3s) timeout, some requests will get an `Endpoint Request Timed-out` response.
3. **Spike Testing:** Run a load testing tool (like `artillery` or `ab`) against the endpoint. You will quickly see how unscaled concurrency and missing queues cripple the system.

## Cleaning Up

To delete the project and its AWS resources:

```bash
sam delete
```
