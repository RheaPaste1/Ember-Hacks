import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Concept } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const fileToTextPart = async (file: File) => {
    const textPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsText(file);
    });
    const text = await textPromise;
    return `\n--- File: ${file.name} ---\n${text}\n--- End File: ${file.name} ---`;
}

export const generateVisual = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image data found in response.");

    } catch (error) {
        console.error("Error generating visual:", error);
        throw new Error("Failed to generate visual from AI.");
    }
};

export const generateLesson = async (topic: string, files: File[], notes: string): Promise<Concept[]> => {
    const textFiles = files.filter(f => f.type.startsWith('text/') || /\.(java|py|js|ts|html|css|json|md|c|cpp|cs)$/i.test(f.name));
    const imageFiles = files.filter(f => f.type.startsWith('image/'));

    const textContent = (await Promise.all(textFiles.map(fileToTextPart))).join('\n');
    const imageParts = await Promise.all(imageFiles.map(fileToGenerativePart));

    const prompt = `
        You are an expert computer science educator. Your task is to create a structured lesson document from the provided files and topic.

        **Lesson Topic:** "${topic}"

        **User Instructions:**
        ${notes || 'No specific instructions provided.'}

        **Files Content:**
        ${textContent}

        Based on the topic, user instructions, and the content of these files (including any images provided), identify the key computer science terms and concepts. For each concept, provide the following:
        1.  **definition:** A clear and concise explanation.
        2.  **notes:** Extra details, important considerations, or common edge cases. For UML diagrams, explain arrow types and access modifiers (+, -, #, ~).
        3.  **visualExample:** If the concept is best represented by a diagram (like a UML class diagram, a flowchart for an algorithm, or an architecture diagram), provide a detailed, descriptive prompt that an image generation AI could use to create this diagram. For concepts that don't need a visual diagram, leave this field as an empty string ("").
        4.  **codeExample:** A relevant code snippet in an appropriate language that demonstrates the concept, formatted with markdown. If a concept is purely visual (e.g., a UML diagram with a detailed 'visualExample' prompt), this field can be an empty string.

        Analyze the images for relevant concepts like diagrams, architectures, or UI mockups.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [{ text: prompt }, ...imageParts]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        concepts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    term: { type: Type.STRING },
                                    definition: { type: Type.STRING },
                                    notes: { type: Type.STRING },
                                    visualExample: { type: Type.STRING },
                                    codeExample: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        
        return parsed.concepts.map((concept: any) => ({ ...concept, id: self.crypto.randomUUID() }));

    } catch (error) {
        console.error("Error generating lesson:", error);
        throw new Error("Failed to generate lesson from AI. Please check the console for details.");
    }
};

export const chatWithBot = async (
    chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
    lesson: any,
    userMessage: string
) => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are a helpful AI assistant for a computer science student. The student is viewing a lesson document. Your role is to help them understand concepts and refine the document.

            **Current Lesson Content:**
            ---
            Topic: ${lesson.topic}
            Concepts: ${JSON.stringify(lesson.concepts.map(({id, term, definition, notes, visualExample, codeExample}) => ({id, term, definition, notes, visualExample, codeExample})))}
            Annotations: ${JSON.stringify(lesson.annotations)}
            ---
            
            Based on the user's request, conversation history, and the lesson content (including their personal annotations), provide a helpful response. If the user asks to modify the document, provide the updated text for that section. If they ask a question, answer it clearly.`
        },
        history: chatHistory,
    });

    const response = await chat.sendMessageStream({ message: userMessage });

    return response;
};