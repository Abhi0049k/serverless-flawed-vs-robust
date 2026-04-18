import json
import logging

# Configure basic logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# In a real app, this would be a DynamoDB table or Redis cache
PROCESSED_MESSAGES_CACHE = set()

def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))
    
    batch_item_failures = []
    
    for record in event.get('Records', []):
        message_id = record.get('messageId')
        body = record.get('body', '{}')
        
        try:
            logger.info("Processing message ID: %s, Body: %s", message_id, body)
            
            # FIX: Basic idempotency check
            if message_id in PROCESSED_MESSAGES_CACHE:
                logger.warning("Message %s already processed! Skipping.", message_id)
                continue
                
            # Parse the payload (Basic validation)
            data = json.loads(body)
            order_id = data.get("orderId", "UNKNOWN")
            
            # Simulate some processing without intentional crashes or random sleep
            logger.info("Successfully processed order: %s", order_id)
            
            # Add to cache to prevent duplicate processing
            PROCESSED_MESSAGES_CACHE.add(message_id)
            
        except Exception as e:
            logger.error("Error processing message %s: %s", message_id, str(e))
            # FIX: If an item fails, append it to the partial batch failure list
            # It will go back to the queue and eventually the DLQ, without failing the whole batch
            batch_item_failures.append({"itemIdentifier": message_id})
            
    # FIX: Return the partial failures back to SQS
    return {
        "batchItemFailures": batch_item_failures
    }
