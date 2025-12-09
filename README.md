# Agenra: One for All (Indian Enterprise Edition)

> **An AI-Native Orchestration Engine for Indian MSMEs & Enterprises.**

Agenra is a unified SaaS platform that consolidates HR, Finance, Recruiting, and Customer Support into a single operating system. It leverages the full suite of **Google Gemini Models (2.5 Flash, 3.0 Pro, and Live API)** to transform static business data into active intelligence.

![Agenra Banner](https://via.placeholder.com/1200x600/0f172a/3b82f6?text=Agenra+AI+Orchestration)

## 🚀 Key Features

### 1. 🗣️ Gemini Live Agent (Voice-First)
- **Real-time Audio Streaming:** Uses `gemini-2.5-flash-native-audio-preview` via WebSockets to enable bi-directional voice conversations.
- **Use Cases:** Automated Level 1 Customer Support and Candidate Mock Interviews.
- **Tech:** Raw PCM audio processing using the Web Audio API.

### 2. 🧠 Superuser Command Center
- **Multi-Tenancy:** Manage multiple client organizations from a single "God Mode" dashboard.
- **Service Provisioning:** Dynamically add/remove modules (Recruiting, Finance, etc.) for tenants.
- **Global Analytics:** Visualize revenue and usage across the entire ecosystem.

### 3. 📊 AI Finance & Forecasting
- **Ledger Parsing:** Upload unstructured financial data (CSV/Text), and Gemini parses it into structured JSON.
- **Growth Forecasting:** Uses historical data to predict future revenue and profit margins.
- **Search Grounding:** Fetches real-time Indian market context using the `googleSearch` tool to explain financial trends.

### 4. 🤝 Recruiting Hub (ATS)
- **Resume Scoring:** Automatically parses resumes against job descriptions to assign a 0-100 fit score.
- **Workflow Automation:** Drag-and-drop pipeline from Application to Offer Letter.
- **Localized:** Handles INR salaries and Indian hiring norms.

### 5. 🏢 HR & Policies
- **Text-to-Speech:** Converts company policies into audio using `gemini-2.5-flash-preview-tts`.
- **Payroll Visualization:** Visual breakdown of Indian salary components (HRA, PF, TDS).

## 🛠️ Tech Stack

- **Framework:** React 19 (SPA)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Dark Mode Enterprise Theme)
- **AI SDK:** `@google/genai`
- **Charts:** Recharts
- **Icons:** Lucide React

## 🤖 Model Usage

| Feature | Model / Tool | Description |
| :--- | :--- | :--- |
| **Live Voice** | `gemini-2.5-flash-native-audio` | Low-latency voice interaction. |
| **Global Chat** | `gemini-3-pro-preview` | Complex reasoning with `thinkingBudget`. |
| **Data Parsing** | `gemini-2.5-flash` | JSON Mode for Resume/Ledger parsing. |
| **Market Research** | `googleSearch` Tool | Real-time web grounding. |
| **TTS Policies** | `gemini-2.5-flash-preview-tts` | High-quality speech generation. |

## 🚀 Getting Started

1.  **Clone the repo**
    ```bash
    git clone https://github.com/your-username/agenra.git
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    # Your Google GenAI API Key
    API_KEY=your_gemini_api_key_here
    ```

4.  **Run the application**
    ```bash
    npm start
    ```

## 📄 License

This project is licensed under the MIT License.
