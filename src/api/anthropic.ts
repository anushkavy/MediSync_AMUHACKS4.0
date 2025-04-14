// api/anthropic.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { TextBlock } from '@anthropic-ai/sdk/resources';




export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Anthropic with server-side environment variable
    const anthropic = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY, // Server-side env variable
    });
    
    // Extract parameters from request body
    const { note, details_to_extract , model, max_tokens } = request.body;
    
    // Create the prompt
    const details_to_extract_str = `\n${details_to_extract}`;
    const prompt = `Summarize the following patient symptoms and information. Focus on these key aspects and return an array of 3 elements respectively adhering to each of the key aspects below:
    ${details_to_extract_str}
    
    If any information is not explicitly stated in the document, note it as "Not specified". Do not preamble.
    Patient notes:
    ${note}`;
    
    // Make the Anthropic API call
    const anthropicResponse = await anthropic.messages.create({
      model: model || "claude-3-7-sonnet-20250219",
      max_tokens: max_tokens || 1000,
      system: "You are an individual with knowledge of all the doctor fields in the world and you are really good at catching diseases from the symptoms people provide you with.",
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "<summary>" }
      ],
      stop_sequences: ["</summary>"]
    });
    
    // Extract and return the response text
    const text = (anthropicResponse.content[0] as TextBlock).text;
    return response.status(200).json({ result: text });
    
  } catch (error: any) {
    console.error("Error calling Anthropic API:", error);
    return response.status(500).json({ error: error.message });
  }
}