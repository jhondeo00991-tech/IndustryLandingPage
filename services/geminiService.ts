import { GoogleGenAI, Type } from "@google/genai";
import { SitePrompt } from "../types";

// Initialize Gemini
// Note: In a real production app, API calls should arguably go through a backend 
// to protect the API KEY, but for this client-side demo, we use the env var directly.
const ai = new GoogleGenAI({ apiKey: "AIzaSyBhs8PD0gWwVSIfeZ3Lmr6oQx1Uv4ICEGQ" });

export const generateLandingPage = async (promptData: SitePrompt): Promise<{ html: string; seoTitle: string; seoDescription: string }> => {
  const model = "gemini-2.5-flash";

  const systemInstruction = `
    You are an expert web developer and UI/UX designer. 
    Your task is to generate a complete, responsive, single-page landing page based on the user's requirements.
    
    Rules:
    1. Output ONLY valid HTML5 code with embedded CSS using Tailwind CSS classes via CDN.
    2. Do NOT use external CSS files. Use <script src="https://cdn.tailwindcss.com"></script> in the head.
    3. Use FontAwesome for icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
    4. Use placeholder images from https://picsum.photos/width/height where appropriate.
    5. The design must be modern, clean, and mobile-responsive.
    6. Include a Hero section, Features section, and a Call to Action footer at minimum.
    7. Ensure high contrast and accessibility.
  `;

  const userPrompt = `
    Create a landing page for a ${promptData.businessType} business named "${promptData.title}".
    Target Audience: ${promptData.targetAudience}.
    Color Theme: ${promptData.colorTheme}.
    Key Features/Sections: ${promptData.features}.
    Main CTA Button Text: ${promptData.ctaText}.
    
    Return a JSON object with the HTML string, a recommended SEO title, and a short SEO description.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            html: {
              type: Type.STRING,
              description: "The full HTML5 document string including <html>, <head>, and <body> tags.",
            },
            seoTitle: {
              type: Type.STRING,
              description: "A catchy SEO title for the page.",
            },
            seoDescription: {
              type: Type.STRING,
              description: "A meta description for search engines.",
            },
          },
          required: ["html", "seoTitle", "seoDescription"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return result;

  } catch (error) {
    console.error("Error generating landing page:", error);
    throw error;
  }
};
