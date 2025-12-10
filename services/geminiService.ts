
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GroundingChunk, Tenant, CandidateProfile, Job } from "../types";
import { base64ToUint8Array, decodeAudioData } from "../utils/audioUtils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Singleton AudioContext to prevent browser limit errors (max 6 contexts)
let ttsAudioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!ttsAudioContext) {
    ttsAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  if (ttsAudioContext.state === 'suspended') {
    ttsAudioContext.resume();
  }
  return ttsAudioContext;
};

// Helper to strip markdown formatting from JSON responses
const cleanJson = (text: string): string => {
  if (!text) return "{}";
  return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const searchMarketData = async (query: string): Promise<{ text: string, sources: GroundingChunk[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No response generated.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources: chunks as GroundingChunk[] };
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string): Promise<void> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Changed to Kore (Female, Neutral)
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const ctx = getAudioContext();
    const audioBuffer = await decodeAudioData(
      base64ToUint8Array(base64Audio),
      ctx,
      24000,
      1
    );

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start();

  } catch (error) {
    console.error("TTS error:", error);
  }
};

export interface CandidateEvaluation {
  score: number;
  reasoning: string;
  fit: 'High' | 'Medium' | 'Low';
  keySkills: string[];
}

export const evaluateCandidate = async (
  resumeText: string, 
  jobDescription: string
): Promise<CandidateEvaluation> => {
  try {
    const prompt = `
      Act as a highly critical Senior Technical Recruiter. Evaluate the candidate with EXTREME STRICTNESS.
      
      SCORING WEIGHTS & PENALTIES:
      1. **Resume Summary (25% Weight)**: 
         - Must show clear impact, seniority, and specific achievements. 
         - If the summary is generic, vague, or missing specific metrics, the score CANNOT exceed 75.
      
      2. **Certifications (25% Weight)**: 
         - Look for recognized industry certifications relevant to the role (e.g., AWS, Azure, PMP, CPA, CISSP).
         - If specific tools/platforms are in the Job Description and the candidate lacks the corresponding certifications, DEDUCT 15 points.
         - High-value certifications are a major plus.

      3. **Experience & Skills (50% Weight)**: 
         - Experience must be an EXACT match. "Similar" experience is not enough for a high score.
         - Penalize for job hopping or lack of depth in key required skills.

      SCORING SCALE:
      - 85-100: Unicorn Candidate. Perfect match + Top Certifications + Stellar Summary.
      - 70-84: Strong Candidate. Good match, good summary, some certifications.
      - 50-69: Average. Meets basics but lacks "wow" factor or certifications.
      - 0-49: Weak. Significant mismatch.

      Job Description:
      ${jobDescription}

      Candidate Resume/Profile:
      ${resumeText}

      Evaluate and return a JSON object with:
      - score: number (0-100)
      - reasoning: string (Explain the score derivation, specifically mentioning the summary and certifications impact)
      - fit: 'High' | 'Medium' | 'Low'
      - keySkills: string[] (List of matching skills)
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score from 0 to 100" },
            reasoning: { type: Type.STRING, description: "Detailed reasoning for the score" },
            fit: { type: Type.STRING, description: "High, Medium, or Low" },
            keySkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of matching skills" }
          },
          required: ["score", "reasoning", "fit", "keySkills"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(cleanJson(text)) as CandidateEvaluation;

  } catch (error) {
    console.error("Evaluation error:", error);
    // Fallback in case of error
    return {
      score: 0,
      reasoning: "AI Evaluation failed. Please try again.",
      fit: "Low",
      keySkills: []
    };
  }
};

export interface ParsedResume {
  name: string;
  experience: string;
  education: string;
  resumeSummary: string;
}

export const parseResume = async (resumeText: string): Promise<ParsedResume> => {
  try {
    const prompt = `
      Extract the following information from the resume text below:
      1. Full Name (if not found, infer or use 'Candidate')
      2. Experience Summary (max 1 short sentence, e.g. "5 years at Google")
      3. Education Summary (max 1 short sentence, e.g. "BS CS from MIT")
      4. Resume Summary (A concise professional summary of the candidate, max 2 sentences)

      Resume Text:
      ${resumeText}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            experience: { type: Type.STRING },
            education: { type: Type.STRING },
            resumeSummary: { type: Type.STRING }
          },
          required: ["name", "experience", "education", "resumeSummary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(cleanJson(text)) as ParsedResume;
  } catch (error) {
    console.error("Parse resume error:", error);
    return {
      name: "Unknown Candidate",
      experience: "N/A",
      education: "N/A",
      resumeSummary: resumeText.slice(0, 100) + "..."
    };
  }
};

export const generateJobDescription = async (title: string, department: string): Promise<string> => {
  try {
    const prompt = `
      Write a professional, concise, and engaging job description for a "${title}" role in the "${department}" department.
      
      Structure:
      - Brief role overview (2 sentences)
      - Key Responsibilities (3-4 bullets)
      - Required Skills/Qualifications (3-4 bullets)
      
      Tone: Professional but inviting.
      Keep it under 150 words total. Do not include markdown formatting or placeholders.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Job description generation error:", error);
    return "Failed to generate description. Please try again.";
  }
};

export const generateApplicationMaterials = async (
  profile: CandidateProfile, 
  job: Job
): Promise<{ coverLetter: string, tailoredResume: string }> => {
  try {
    const prompt = `
      You are a professional career coach. 
      
      TASK:
      Create a tailored Cover Letter and a Tailored Resume Summary for the candidate applying to the specific job below.

      CONSTRAINTS:
      1. **Strict Adherence**: You must ONLY use the facts provided in the Candidate Profile. Do not hallucinate or invent new experience, companies, or skills.
      2. **Reframing**: You CAN reframe their existing experience to highlight aspects most relevant to the Job Description.
      3. **Tone**: Professional, confident, and eager.

      INPUT DATA:
      Candidate Name: ${profile.name}
      Candidate Experience: ${profile.experience}
      Candidate Skills/Bio: ${profile.bio}
      Resume Text: ${profile.resumeText || "N/A"}
      
      Target Job Title: ${job.title}
      Target Company: ${job.tenantId === 'tenant-A' ? 'TechFlow Solutions' : 'Global Finance Corp'}
      Job Description: ${job.description}

      OUTPUT FORMAT (JSON):
      {
        "coverLetter": "Full cover letter text...",
        "tailoredResume": "A re-written professional summary and bullet points of experience highlighted for this specific job..."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coverLetter: { type: Type.STRING },
            tailoredResume: { type: Type.STRING }
          },
          required: ["coverLetter", "tailoredResume"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(cleanJson(text));

  } catch (error) {
    console.error("Application generation error:", error);
    return {
      coverLetter: "Error generating cover letter.",
      tailoredResume: "Error generating resume."
    };
  }
};

export const analyzeSupportTickets = async (tenants: Tenant[]): Promise<string> => {
  try {
    // Aggregate tickets with Billing Context
    let allData = "";
    tenants.forEach(t => {
      allData += `\nOrganization: ${t.name}\n`;
      allData += `Billing Status: ${t.billing.status} (Due: $${t.billing.amountDue})\n`;
      if (t.supportTickets.length === 0) {
        allData += `Tickets: None\n`;
      } else {
        t.supportTickets.forEach(ticket => {
          allData += `- [${ticket.priority.toUpperCase()}] ${ticket.subject} (Status: ${ticket.status})\n`;
        });
      }
    });

    if (!allData) return "No data found to analyze.";

    const prompt = `
      You are the AI Support Intelligence Agent for a Superuser Dashboard.
      Analyze the following data from multiple tenants.
      
      Pay close attention to the correlation between BILLING STATUS and SUPPORT TICKETS.
      If a tenant is 'overdue' or 'suspended', check if their tickets relate to service access or billing issues.

      Data:
      ${allData}

      Your Task:
      1. Group the issues into clusters.
      2. Identify ROOT CAUSES. (e.g. Is the technical issue actually a billing suspension?)
      3. **SUGGESTED FIXES**: Provide step-by-step technical or administrative fixes for the issues.
      4. Provide a STRATEGIC PREVENTION PLAN.

      Format the output as a clean, professional Markdown report.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    return response.text || "Unable to generate analysis.";
  } catch (error) {
    console.error("Support analysis error:", error);
    return "Error occurred while analyzing support tickets.";
  }
};

// --- FINANCIAL CAPABILITIES ---

export interface LedgerItem {
  category: string; // "Revenue", "COGS", "OpEx"
  name: string; // e.g. "Product Sales"
  period1: number; // e.g. Q1 or 2023
  period2: number; // e.g. Q2 or 2024
}

export const parseFinancialLedger = async (fileContent: string, viewMode: 'quarterly' | 'yearly'): Promise<LedgerItem[]> => {
  try {
    const prompt = `
      Analyze the following financial ledger text (which might be CSV or unstructured text).
      Extract financial line items and normalize them into a list of objects.
      
      The user is viewing this in '${viewMode}' mode.
      - If 'quarterly', treat Period 1 as Previous Quarter and Period 2 as Current Quarter.
      - If 'yearly', treat Period 1 as Previous Year and Period 2 as Current Year.

      Map the items into three categories: "Revenue", "Cost of Goods Sold (COGS)", and "Operating Expenses (OpEx)".
      
      Ledger Content:
      ${fileContent.slice(0, 5000)} // Truncate to avoid token limits

      Return JSON format:
      [
        { "category": "Revenue", "name": "Item Name", "period1": 1000, "period2": 1200 },
        ...
      ]
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              name: { type: Type.STRING },
              period1: { type: Type.NUMBER },
              period2: { type: Type.NUMBER }
            },
            required: ["category", "name", "period1", "period2"]
          }
        }
      }
    });

    return JSON.parse(cleanJson(response.text || "[]")) as LedgerItem[];
  } catch (error) {
    console.error("Ledger parse error:", error);
    return [];
  }
};

export interface ForecastResult {
  predictions: { name: string; revenue: number; profit: number }[];
  analysis: string;
}

export const generateFinancialForecast = async (currentData: any[], timeframe: string): Promise<ForecastResult> => {
  try {
    // Truncate input data to avoid exceeding token limits or confusing the model
    const dataString = JSON.stringify(currentData).slice(0, 10000);

    const prompt = `
      Act as a Chief Financial Officer.
      Based on the historical financial data provided below, generate a forecast for the next 4 periods (${timeframe}).
      
      Data:
      ${dataString}

      Task:
      1. Predict Revenue and Profit for the next 4 periods based on trends (seasonality, growth rate).
      2. Provide a strategic analysis (2-3 paragraphs) explaining the forecast, highlighting risks, and suggesting budget adjustments.

      IMPORTANT: Do not repeat the historical data in the response. Return only the JSON object.

      Return JSON:
      {
        "predictions": [
          { "name": "Period 1", "revenue": 100, "profit": 20 },
          { "name": "Period 2", "revenue": 110, "profit": 25 },
          ...
        ],
        "analysis": "Markdown formatted text analysis..."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            predictions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  revenue: { type: Type.NUMBER },
                  profit: { type: Type.NUMBER }
                }
              }
            },
            analysis: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from model");
    return JSON.parse(cleanJson(text)) as ForecastResult;
  } catch (error) {
    console.error("Forecast error:", error);
    throw error;
  }
};

// --- NEW CAPABILITIES ---

// 1. Chat with Gemini 3 Pro (with Thinking Budget)
export const chatWithPro = async (
  history: {role: string, parts: {text: string}[]}[], 
  message: string, 
  useThinking: boolean,
  systemInstruction?: string
): Promise<string> => {
  try {
    const config: any = {};
    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 }; // Max for Gemini 3 Pro
    }
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: config
    });

    const response = await chat.sendMessage({ message });
    return response.text || "No response.";
  } catch (error) {
    console.error("Chat error:", error);
    return "I encountered an error. Please try again.";
  }
};

// 2. Transcribe Audio Note (Gemini 2.5 Flash)
export const transcribeAudioNote = async (audioBase64: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/webm", data: audioBase64 } },
          { text: "Transcribe this audio note accurately. Return only the transcription." }
        ]
      }
    });
    return response.text || "Transcription failed.";
  } catch (error) {
    console.error("Transcription error:", error);
    return "Error transcribing audio.";
  }
};

// 3. Quick Summarize (Gemini Flash Lite)
export const quickSummarize = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest", 
      contents: `Summarize this in 1 short sentence: ${text}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Summarize error:", error);
    return "Summary unavailable.";
  }
};

// 4. Generate IT Policy (Gemini 2.5 Flash)
export const generateITPolicy = async (topic: string): Promise<string> => {
  try {
    const prompt = `
      Act as a Chief Information Security Officer (CISO) for an Indian Mid-Market Enterprise.
      Draft a formal, comprehensive IT Policy for: "${topic}".

      Requirements:
      1. Professional, legalistic but readable tone.
      2. Structure: Purpose, Scope, Policy Guidelines, Enforcement, and Compliance.
      3. Local Context: Mention alignment with the Information Technology Act, 2000 (India) and Data Privacy Rules where relevant.
      4. Format: Plain text with clear section headers. Keep it under 300 words for readability.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Failed to generate policy.";
  } catch (error) {
    console.error("Policy generation error:", error);
    return "Error generating policy. Please try again.";
  }
};
