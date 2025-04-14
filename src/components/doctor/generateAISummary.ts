import Anthropic from "@anthropic-ai/sdk";



const anthropicAPIkey = import.meta.env.VITE_ANTHROPIC_API_KEY
const anthropic = new Anthropic({
  
  apiKey: anthropicAPIkey ,
  dangerouslyAllowBrowser: true
});



const details_to_extract_arr: string[] = [
    'Overall Insights on Patient notes',
    'Recommendation that can be given for patients issues', 
    'Not specified Information'
]


async function summarize_notes(note: string[], details_to_extract = details_to_extract_arr, model="claude-3-7-sonnet-20250219", max_tokens=1000){

    const details_to_extract_str = `\n${details_to_extract}`
    
    const prompt = `Summarize the following patient symptoms and information. Focus on these key aspects and return an array of 3 elements respectively adhering to each of the key aspects below:

    ${details_to_extract_str}


    
    If any information is not explicitly stated in the document, note it as "Not specified". Do not preamble.

    Patient notes:
    ${note}`

    const response =  await anthropic.messages.create({
        model: model,
        max_tokens: max_tokens,
        system: "You are an individual with knowledge of all the doctor fields in the world and you are really good at catching diseases from the symptoms people provide you with.",
        messages: [
      { role: "user", content: prompt },
      { role: "assistant", content: "<summary>" }
    ],
    stop_sequences: ["</summary>"]
        }
    )

   const text = (response.content[0] as Anthropic.TextBlock).text;

   return text
}




export default summarize_notes;