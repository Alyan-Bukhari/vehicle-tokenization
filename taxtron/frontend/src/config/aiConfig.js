// AI Configuration for TaxTron
export const AI_CONFIG = {
  // Hugging Face API Configuration (Free Tier)
  HUGGING_FACE: {
    API_URL: "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
    API_KEY: import.meta.env.VITE_HUGGING_FACE_API_KEY || "hf_xxx", // Set your API key here
    MODEL_NAME: "microsoft/DialoGPT-medium",
    MAX_REQUESTS_PER_MONTH: 30000, // Free tier limit
    MAX_CONCURRENT_REQUESTS: 2
  },

  // Alternative: OpenAI Configuration (if you want to use it later)
  OPENAI: {
    API_URL: "https://api.openai.com/v1/chat/completions",
    API_KEY: import.meta.env.VITE_OPENAI_API_KEY || "",
    MODEL: "gpt-3.5-turbo",
    MAX_TOKENS: 150
  },

  // Local AI Configuration (for future Ollama integration)
  LOCAL: {
    ENABLED: false,
    API_URL: "http://localhost:11434/api/generate",
    MODEL: "llama2:7b"
  }
};

// AI Response Templates
export const AI_RESPONSES = {
  WELCOME: `Hello! I'm your TaxTron AI assistant. I can help you with:

• Vehicle registration process
• Understanding required documents
• Step-by-step guidance
• Answering general questions

How can I help you today?`,

  REGISTRATION_GUIDE: `I'd be happy to help you register a vehicle! To get started, I need some basic information:

What type of vehicle do you want to register? Please include:
- Vehicle make (e.g., Toyota, Honda)
- Vehicle model (e.g., Corolla, Civic)
- Manufacturing year (e.g., 2020)

For example: "Register a 2020 Toyota Corolla"`,

  DOCUMENTS_REQUIRED: `For vehicle registration, you'll need these documents:

📋 Required Documents:
• CNIC (Computerized National Identity Card)
• Vehicle Registration Book (if applicable)
• Engine Number (found on engine block)
• Chassis Number (found on door frame)
• Vehicle Make, Model, and Year
• Proof of Ownership

Would you like me to help you start the registration process?`,

  FEES_INFO: `Registration fees vary by vehicle type:

💰 Fee Structure:
• Car: Rs. 5,000 (base) + additional for engine capacity >2000cc
• Motorcycle: Rs. 2,000 (base) + additional for engine capacity >600cc
• Truck: Rs. 8,000
• Bus: Rs. 10,000
• Van: Rs. 6,000
• SUV: Rs. 7,000

Tax amounts are set separately by authorities. Would you like to calculate fees for your specific vehicle?`,

  PROCESS_STEPS: `Here's the complete registration process:

🔄 Registration Steps:
1. 📝 Submit inspection request with vehicle details
2. 📅 Book inspection appointment
3. 🔍 Vehicle inspection by authorities
4. ✅ Inspection approval
5. 💰 Pay registration fees
6. 🎫 Receive digital certificate (NFT)
7. 📊 Pay annual taxes

I can guide you through each step! Would you like to start?`
};

// Vehicle Information Extraction Patterns
export const VEHICLE_PATTERNS = {
  YEAR: /\b(19|20)\d{2}\b/,
  MAKE_MODEL: [
    /(toyota|honda|suzuki|ford|bmw|audi|mercedes|hyundai|kia|nissan|volkswagen|chevrolet|dodge|jeep|lexus|infiniti|acura|mazda|subaru|mitsubishi)\s+(\w+)/i,
    /(\w+)\s+(corolla|civic|swift|focus|3-series|a4|c-class|elantra|rio|altima|golf|cruze|challenger|wrangler|rx|q50|tl|cx-5|impreza|lancer)/i
  ]
};

export default AI_CONFIG;
