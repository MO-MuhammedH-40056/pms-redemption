const DEFAULT_TIMEOUT = 30000;

export async function callApi(url, body, timeoutMs = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Log request (mask FileBinary to avoid flooding console)
  const logBody = { ...body };
  if (logBody.FileBinary) logBody.FileBinary = `[binary ~${Math.round(logBody.FileBinary.length / 1024)}KB]`;
  if (logBody.document)   logBody.document   = `[binary ~${Math.round(logBody.document.length / 1024)}KB]`;
  console.group(`[API] POST ${url}`);
  console.log('Request payload:', logBody);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
      mode: 'cors',
    });

    clearTimeout(timer);

    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const rawText = await response.text();
    console.log('Raw response body:', rawText);

    if (!response.ok) {
      console.error('Non-OK response:', response.status, rawText);
      console.groupEnd();
      throw new Error(`HTTP ${response.status}: ${rawText || response.statusText}`);
    }

    // Try to parse as JSON regardless of content-type header.
    // Some APIs return Python-style single-quoted dicts — normalise to double quotes as fallback.
    let parsed;
    try {
      parsed = JSON.parse(rawText);
      console.log('Parsed JSON:', parsed);
    } catch {
      try {
        parsed = JSON.parse(rawText.replace(/'/g, '"'));
        console.log('Parsed JSON (single-quote normalised):', parsed);
      } catch {
        console.log('Response is plain text (not JSON)');
        parsed = rawText;
      }
    }

    console.groupEnd();
    return parsed;
  } catch (err) {
    clearTimeout(timer);
    console.error('API call error:', err);
    console.groupEnd();

    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    if (
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('CORS') ||
      err.message.includes('blocked by CORS')
    ) {
      throw new Error(
        'CORS_ERROR: Unable to reach the server. Please ensure the API is accessible.'
      );
    }
    throw err;
  }
}
