// src/utils/summarize_notes.ts
const details_to_extract_arr: string[] = [
    'Overall Insights on Patient notes',
    'Recommendation that can be given for patients issues', 
    'Not specified Information'
];

async function summarize_notes(
  note: string[], 
  details_to_extract: string[] = details_to_extract_arr, 
  model: string = "claude-3-7-sonnet-20250219", 
  max_tokens: number = 1000
): Promise<string> {
  try {
    // Call your server endpoint instead of Anthropic directly
    const response = await fetch('/api/anthropic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        note,
        details_to_extract,
        model,
        max_tokens
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get response');
    }
    
    const data = await response.json();
    return data.result;
    
  } catch (error) {
    console.error("Error in summarize_notes:", error);
    throw error;
  }
}

export default summarize_notes;