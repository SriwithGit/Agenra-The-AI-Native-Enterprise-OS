// -------------------------------------------------------------
//  Agenra - Mock Gemini Service (Competition-Safe, CC-BY-4.0)
// -------------------------------------------------------------
//  This file replaces all real AI calls with deterministic,
//  safe, cost-free mock responses. The structure of functions
//  and return types matches the real implementation so the UI
//  behaves exactly the same without breaking.
// -------------------------------------------------------------

// --- Utility: Simulate slight randomness for realistic UI ---
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// --- MOCK: searchMarketData ---------------------------------
export const searchMarketData = async (query: string) => {
  return {
    text: `Mocked market summary for: ${query}`,
    sources: [
      {
        title: "Mock Source 1",
        uri: "https://example.com/mock-source-1",
        snippet: "This is a mocked grounding snippet."
      }
    ]
  };
};

// --- MOCK: Text-to-Speech -----------------------------------
export const generateSpeech = async (_text: string): Promise<void> => {
  console.log("TTS mock: pretending to play audio.");
  return;
};

// --- Candidate Evaluation (Mock) -----------------------------
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
  const score = rand(55, 85);
  const fit =
    score >= 80 ? "High" :
    score >= 65 ? "Medium" : "Low";

  return {
    score,
    reasoning:
      `This is a mock evaluation.\nCandidate resume tokens: ${resumeText.length}\nJob description length: ${jobDescription.length}.`,
    fit,
    keySkills: ["Communication", "Leadership", "MockSkill"]
  };
};

// --- Resume Parsing (Mock) ----------------------------------
export interface ParsedResume {
  name: string;
  experience: string;
  education: string;
  resumeSummary: string;
}

export const parseResume = async (resumeText: string): Promise<ParsedResume> => {
  return {
    name: "Candidate (Mock)",
    experience: "3 years (mocked)",
    education: "Bachelor's Degree (mocked)",
    resumeSummary: resumeText.slice(0, 120) || "Mocked summary."
  };
};

// --- Job Description Generation (Mock) -----------------------
export const generateJobDescription = async (
  title: string,
  department: string
): Promise<string> => {
  return `
${title} - ${department} Department (Mocked)

Responsibilities:
- Mock responsibility 1
- Mock responsibility 2
- Mock responsibility 3

Qualifications:
- Mock skill A
- Mock skill B
- Mock skill C
  `.trim();
};

// --- Application Materials (Mock) ----------------------------
export const generateApplicationMaterials = async (profile: any, job: any) => {
  return {
    coverLetter: `Dear Hiring Manager,\nThis is a mocked cover letter for ${profile.name} applying to ${job.title}.`,
    tailoredResume: `Mock tailored resume summary for ${profile.name}.`
  };
};

// --- Support Ticket Analysis (Mock) --------------------------
export const analyzeSupportTickets = async (tenants: any[]) => {
  return `
## Mock Support Analysis

Tenants analyzed: ${tenants.length}

### Summary
- Detected billing-related patterns (mocked)
- Found repeated support themes (mocked)

### Recommendation
Implement proactive monitoring (mock).
  `.trim();
};

// --- Financial Ledger Parsing (Mock) -------------------------
export interface LedgerItem {
  category: string;
  name: string;
  period1: number;
  period2: number;
}

export const parseFinancialLedger = async (
  _fileContent: string,
  _viewMode: 'quarterly' | 'yearly'
): Promise<LedgerItem[]> => {
  return [
    { category: "Revenue", name: "Mock Product Sales", period1: 10000, period2: 12000 },
    { category: "COGS", name: "Mock Supplier Costs", period1: 4000, period2: 4500 },
    { category: "OpEx", name: "Mock Operations", period1: 3000, period2: 3200 }
  ];
};

// --- Financial Forecast (Mock) -------------------------------
export interface ForecastResult {
  predictions: { name: string; revenue: number; profit: number }[];
  analysis: string;
}

export const generateFinancialForecast = async (
  _currentData: any[],
  timeframe: string
): Promise<ForecastResult> => {
  return {
    predictions: [
      { name: `${timeframe} 1`, revenue: 12000, profit: 3000 },
      { name: `${timeframe} 2`, revenue: 13000, profit: 3200 },
      { name: `${timeframe} 3`, revenue: 14000, profit: 3400 },
      { name: `${timeframe} 4`, revenue: 15000, profit: 3600 }
    ],
    analysis:
      "This is a mocked forecast. Replace with real Gemini logic after the competition."
  };
};

// --- Chat (Mock) ---------------------------------------------
export const chatWithPro = async (
  _history: any[],
  message: string,
  _useThinking: boolean
): Promise<string> => {
  return `Mock reply: You said "${message}".`;
};

// --- Audio Transcription (Mock) ------------------------------
export const transcribeAudioNote = async (_audioBase64: string): Promise<string> => {
  return "Mock transcription: [audio simulated]";
};

// --- Quick Summarize (Mock) ---------------------------------
export const quickSummarize = async (text: string): Promise<string> => {
  return `Summary (mocked): ${text.slice(0, 50)}...`;
};

// --- Generate IT Policy (Mock) -------------------------------
export const generateITPolicy = async (topic: string): Promise<string> => {
  return `
# IT Policy for ${topic} (Mocked)
Purpose: Mock purpose.
Scope: Mock scope.
Policy Guidelines: Mock guidelines.
Enforcement: Mock enforcement.
Compliance: Mock compliance.
  `.trim();
};