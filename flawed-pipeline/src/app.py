import json
import time
import random
import logging

# Configure basic logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))
    
    for record in event.get('Records', []):
        body = record.get('body', '{}')
        logger.info("Processing message: %s", body)
        
        # ISSUE: No idempotency check.
        # A robust pipeline would check a database (e.g., DynamoDB) to see if the event ID was already processed.
        logger.info("Processing event blindly (no idempotency check)...")
        
        # ISSUE: Random intentional failure (30% chance).
        # Since there is no Dead Letter Queue (DLQ) configured in the infrastructure,
        # these messages will be permanently lost when the retry limits run out.
        if random.random() < 0.30:
            logger.error("Intentional random failure triggered!")
            raise Exception("Random failure! System instability simulated. Message lost.")
        
        # ISSUE: Slow operation without optimization or timeout handling.
        # Causes frequent timeouts since SAM timeout is set to 3 seconds.
        delay = random.uniform(2.0, 5.0)
        logger.info("Starting slow operation. Simulating processing for %.2f seconds...", delay)
        time.sleep(delay)
        
        logger.info("Successfully processed event.")
        
    return {
        "statusCode": 200,
        "body": "Successfully processed"
    }
