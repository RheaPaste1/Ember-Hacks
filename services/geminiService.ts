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
        const enhancedPrompt = `
            Task: Generate a technical diagram for the concept: "${prompt}".
            
            Style requirements:
            - Type: 2D schematic diagram ONLY.
            - Color: Black and white ONLY.
            - Background: Solid white.
            - Elements: Use only simple geometric shapes (rectangles, circles, diamonds) and lines/arrows.
            - Text: All text MUST be legible and fit completely inside its shape. This is the most important rule.
            
            Content rules:
            - DO NOT draw any real-world objects, animals, people, or fantasy creatures. The output MUST be a diagram, not an illustration or a picture.
            - DO NOT use any textures, gradients, or shadows.
            - For example, if the prompt is "class diagram", draw the boxes and arrows, do NOT draw a picture of a classroom.
            - Prohibited subjects to draw: mermaids, cars, trees, people, animals, buildings. The output must be purely abstract and informational.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: enhancedPrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const firstCandidate = response.candidates?.[0];
        const firstPart = firstCandidate?.content?.parts?.[0];

        if (firstPart?.inlineData?.data) {
            return firstPart.inlineData.data;
        }

        console.error("Unexpected response structure from generateVisual API:", response);
        throw new Error("Could not generate visual. The response from the AI was empty or invalid.");

    } catch (error) {
        console.error("Error generating visual:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate visual from AI: ${error.message}`);
        }
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

export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) {
            throw new Error("No audio data returned from API.");
        }
        return audioData;
    } catch (error) {
        console.error("Error generating speech:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate speech from AI: ${error.message}`);
        }
        throw new Error("Failed to generate speech from AI.");
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
            systemInstruction: `You are a helpful and engaging AI tutor for a computer science student. Your primary goal is to keep the student engaged and curious.

            **Your communication style:**
            - **Concise & Focused:** Directly answer the user's question without providing excessive, unasked-for information.
            - **Interactive:** After your answer, ALWAYS suggest one or two brief, relevant follow-up questions to encourage them to dig deeper. Frame them like "Want to explore how this applies to X?" or "Curious about the time complexity?".
            - **Visually Engaging:** Use markdown to format your responses for clarity and visual appeal. Use **bold** for key terms, bullet points for key ideas, and code blocks for any code.
            - **Use Emojis:** Sparingly use emojis to add personality and visual cues (e.g., ✅ for confirmations, 💡 for ideas, 🤔 for questions). Don't overdo it.
            - **Supportive Tone:** Be friendly, encouraging, and act as a study partner.

            **Context of the conversation:**
            The student is currently viewing a lesson document. Your primary focus is this lesson.

            **Handling Out-of-Scope Questions:**
            If the user asks a question that is not directly covered in the lesson content, provide a brief, high-level explanation to help them understand the concept. Do not go into excessive detail. After your brief explanation, gently guide the conversation back to the current lesson topic. For example: "That's a great question! In simple terms, [brief explanation]. We can dive deeper into that later, but for now, how about we connect this back to [concept from lesson]?"

            **Current Lesson Content:**
            ---
            Topic: ${lesson.topic}
            Concepts: ${JSON.stringify(lesson.concepts.map(({id, term, definition, notes, visualExample, codeExample}) => ({id, term, definition, notes, visualExample, codeExample})))}
            Annotations: ${JSON.stringify(lesson.annotations)}
            ---
            
            Based on the user's request, the conversation history, and the lesson content, provide a concise, engaging, and helpful response following the communication style outlined above. If the user asks to modify the document, provide ONLY the updated text for that section and confirm the change has been noted.`
        },
        history: chatHistory,
    });

    const response = await chat.sendMessageStream({ message: userMessage });

    return response;
};