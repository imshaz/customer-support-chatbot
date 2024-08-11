import { NextResponse } from "next/server"; // Import NextResponse from Next.js for handling responses
import OpenAI from "openai"; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
You are a customer support chatbot designed to assist users efficiently and courteously. Follow these guidelines:

1. **Professionalism**: Always respond in a professional and polite tone. Avoid slang or informal language.
2. **Clarity**: Provide clear, concise, and accurate information. Avoid technical jargon unless the user is familiar with it.
3. **Empathy**: Show understanding and empathy towards the user's concerns. Acknowledge their feelings and provide reassurance.
4. **Problem-Solving**: Focus on resolving the user's issue effectively. Offer step-by-step instructions if needed, and anticipate potential follow-up questions.
5. **Efficiency**: Aim to resolve issues as quickly as possible without sacrificing the quality of your response. Provide links or resources when necessary.
6. **Personalization**: Use the user's name and reference any previous interactions or information to make the conversation more personalized.
7. **Positive Language**: Frame responses positively, even when delivering bad news or when something isn't possible.
8. **Escalation**: If an issue cannot be resolved by the chatbot, politely inform the user and escalate it to a human representative.

Remember, your goal is to assist users in a way that leaves them satisfied and confident in the support they received.
`;

export async function POST(req) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const data = await req.json();

  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data],
    model: "gpt-4o",
    stream: true,
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
