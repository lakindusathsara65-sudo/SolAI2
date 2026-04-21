import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeGardenImage(base64Image: string, mimeType: string, prompt: string) {
  const imagePart = {
    inlineData: {
      mimeType,
      data: base64Image,
    },
  };
  const textPart = {
    text: `You are a professional landscape architect and botanist. 
    Analyze this image and the user's request: "${prompt}". 
    Identify plants, describe the design style (e.g., Zen, Mediterranean, English Cottage), 
    and provide specific improvement tips or a derived layout plan.
    Format your response in Markdown.`,
  };

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts: [imagePart, textPart] },
  });

  return response.text;
}

export async function analyzeFacebookInfo(info: any) {
  const prompt = `You are a professional landscape architect. 
  I have fetched some information from a Facebook page that might be an inspiration source:
  Name: ${info.name}
  About: ${info.about || 'N/A'}
  Description: ${info.description || 'N/A'}
  
  Based on this text, extract the core aesthetic and landscape preferences. 
  Suggest how this style can be applied to a personal garden.
  Provide a bulleted list of potential plant types and design elements.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}

export async function generateGardenVisualization(prompt: string, preferences: any) {
  const fullPrompt = `Create a high-quality, professional 3D visualization of a dream garden. 
  Style: ${preferences.style}. 
  Climate/Environment: ${preferences.climate}. 
  Features requested: ${prompt}. 
  Ensure the lighting is beautiful (e.g. golden hour or soft morning light). 
  No people in the image. Professional architectural photography style.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: fullPrompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      },
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function chatAboutGarden(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config: {
      systemInstruction: "You are SolAI, an AI garden consultant. You help users design gardens, identify plants, and provide care tips. Be inspiring, knowledgeable, and practical.",
    }
  });

  return response.text;
}
