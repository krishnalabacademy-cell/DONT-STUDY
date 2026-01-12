
import { GoogleGenAI, Modality } from "@google/genai";
import { AI_SYSTEM_PROMPT, AI_ANALYZE_PROMPT, AI_NOTIFICATION_PROMPT } from "../constants";

const getAi = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey });
};

const fileToGenerativePart = (base64Data: string) => {
    const match = base64Data.match(/^data:(image\/.*?);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid base64 string");
    }
    const mimeType = match[1];
    const data = match[2];

    return {
        inlineData: {
            data,
            mimeType
        },
    };
};

export const getAiCoachResponse = async (prompt: string, image: string | null): Promise<string> => {
    const ai = getAi();
    const modelName = image ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';
    
    let requestContents;
    if (image) {
        // CORRECTED: The API expects an object with a 'parts' array for multipart content.
        requestContents = { 
            parts: [
                fileToGenerativePart(image),
                { text: prompt }
            ]
        };
    } else {
        requestContents = prompt;
    }

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: requestContents,
            config: { systemInstruction: AI_SYSTEM_PROMPT }
        });

        const text = response.text;
        if (!text) {
            return "Radhe Radhe Ji 🙏. Mujhe maaf kijiye, main iska jawab nahi de paa rahi hoon. Aap firse koshish karenge?";
        }
        return text;
    } catch (error) {
        console.error("Gemini API error (Coach):", error);
        return "Radhe Radhe Ji 🙏. Ek takneeki samasya aa gayi hai. Kripya thodi der baad firse prayas karein.";
    }
};

export const analyzeImageWithAi = async (image: string): Promise<string> => {
    const ai = getAi();
    const modelName = 'gemini-2.5-flash-image';
    
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            // CORRECTED: The API expects an object with a 'parts' array for multipart content.
            contents: { 
                parts: [
                    { text: AI_ANALYZE_PROMPT },
                    fileToGenerativePart(image)
                ]
            },
        });

        const text = response.text;
        if (!text) {
            return "Radhe Radhe Ji 🙏. Main is image ko samajh nahi paa rahi hoon. Kya aap ek doosri, saaf photo bhej sakte hain?";
        }
        return text;
    } catch (error) {
        console.error("Gemini API error (Analyze):", error);
        return "Radhe Radhe Ji 🙏. Image ko analyze karte samay ek samasya aa gayi hai. Kripya firse prayas karein.";
    }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    const ai = getAi();
    const modelName = 'gemini-2.5-flash-preview-tts';

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Puck' }, // A respectful and caring male voice
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Gemini API error (Speech Generation):", error);
        // Don't return an error message to be spoken, just fail silently.
        return null;
    }
};


export const generateNotificationContent = async (): Promise<{ title: string; body: string }> => {
    const ai = getAi();
    const modelName = 'gemini-3-flash-preview';

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: AI_NOTIFICATION_PROMPT,
        });

        const text = response.text;
        if (!text) {
          throw new Error("Empty response from AI");
        }
        
        // Simple parsing, assuming AI gives a single sentence.
        const sentences = text.split('. ');
        return {
            title: "Study Reminder 📖",
            body: sentences[0],
        };

    } catch (error) {
        console.error("Gemini API error (Notification):", error);
        // Fallback content
        return {
            title: "Time to Study!",
            body: "Don't forget your scheduled study session. You can do it!",
        };
    }
};