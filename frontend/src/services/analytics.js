export async function trackCommand({ sessionId, input, canvasState, output, latencyMs, tokenCount, isClarify }) {
  try {
    const res = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        eventType: 'command',
        data: { input, canvasState, output, latencyMs, tokenCount, isClarify },
      }),
    });
    const { id } = await res.json();
    return id;
  } catch (err) {
    console.warn('analytics trackCommand failed:', err);
    return null;
  }
}

export async function trackFeedback({ sessionId, commandLogId, feedbackType, input, output }) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        eventType: 'feedback',
        data: { commandLogId, feedback: feedbackType, input, output },
      }),
    });
  } catch (err) {
    console.warn('analytics trackFeedback failed:', err);
  }
}
