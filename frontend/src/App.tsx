import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function App() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_GATEWAY_URL || '');
  const [payload, setPayload] = useState('{\n  "message": "Hello Serverless",\n  "timestamp": "' + new Date().toISOString() + '"\n}');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUrl) {
      setStatus({ type: 'error', message: 'Please enter the API Gateway URL.' });
      return;
    }

    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload); // Validate JSON format
    } catch (err) {
      setStatus({ type: 'error', message: 'Invalid JSON payload. Please correct it.' });
      return;
    }

    setIsSending(true);
    setStatus(null);

    try {
      // Determine if we are sending one object or an array of objects
      const payloadsToSend = Array.isArray(parsedPayload) ? parsedPayload : [parsedPayload];
      let successCount = 0;
      let failCount = 0;

      setStatus({ type: 'success', message: `Sending ${payloadsToSend.length} payload(s)...` });

      // Loop through all objects and send them individually
      for (let i = 0; i < payloadsToSend.length; i++) {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadsToSend[i]),
          });

          if (!response.ok) {
            failCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          failCount++;
        }
        
        // Update the UI progressively
        setStatus({ 
          type: 'success', 
          message: `Sending: ${i + 1} of ${payloadsToSend.length}... (Success: ${successCount}, Failed: ${failCount})` 
        });

        // Tiny delay to keep the browser UI responsive
        await new Promise(r => setTimeout(r, 50));
      }

      setStatus({ 
        type: failCount === 0 ? 'success' : (successCount === 0 ? 'error' : 'success'), 
        message: `Finished! Successfully sent ${successCount} message(s). ${failCount > 0 ? `Failed: ${failCount}` : ''}` 
      });
      
    } catch (error: any) {
      setStatus({ 
        type: 'error', 
        message: `Failed to process data. ${error.message || 'Check URL and CORS setup.'}` 
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Pipeline Tester</h1>
        <p>Send test payloads to your SQS Lambda architecture</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="apiUrl">API Gateway URL</label>
          <input
            id="apiUrl"
            type="url"
            placeholder="https://xxxxx.execute-api.region.amazonaws.com/Prod/process"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            required
            autoComplete="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor="payload">JSON Payload</label>
          <textarea
            id="payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            required
            spellCheck="false"
          />
        </div>

        <button type="submit" disabled={isSending}>
          {isSending ? (
            <div className="spinner"></div>
          ) : (
            <>
              <Send size={20} />
              Send to SQS Queue
            </>
          )}
        </button>
      </form>

      {status && (
        <div className={`status-message ${status.type}`}>
          {status.type === 'success' ? (
            <CheckCircle size={18} style={{verticalAlign: 'middle', marginRight: '8px'}} />
          ) : (
            <AlertCircle size={18} style={{verticalAlign: 'middle', marginRight: '8px'}} />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
