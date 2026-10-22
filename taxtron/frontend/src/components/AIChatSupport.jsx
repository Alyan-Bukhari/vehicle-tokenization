import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader2 } from 'lucide-react';
import axios from 'axios';
import { AI_CONFIG, AI_RESPONSES, VEHICLE_PATTERNS } from '../config/aiConfig';

const AIChatSupport = ({ isOpen, onClose, account, onStartRegistration }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationState, setRegistrationState] = useState({});
  const messagesEndRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(true);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'bot',
          content: AI_RESPONSES.WELCOME,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Hugging Face API configuration (free tier)
  const HUGGING_FACE_API_URL = AI_CONFIG.HUGGING_FACE.API_URL;
  const API_KEY = AI_CONFIG.HUGGING_FACE.API_KEY;

  const processUserMessage = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for registration intent
    if (lowerMessage.includes('register') || lowerMessage.includes('registration')) {
      return handleRegistrationIntent(userMessage);
    }

    // Check for general questions
    if (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('help')) {
      return handleGeneralQuestions(userMessage);
    }

    // Check for specific field requests
    if (lowerMessage.includes('cnic') || lowerMessage.includes('engine') || lowerMessage.includes('chassis')) {
      return handleFieldSpecificQuestions(userMessage);
    }

    // Check if user is providing information during registration
    if (registrationState.step === 'collecting_details') {
      return handleRegistrationDataCollection(userMessage);
    }

    // Default response
    return "I'm here to help with vehicle registration. You can ask me about the registration process, required documents, or start a new registration. What would you like to do?";
  };

  const handleRegistrationIntent = (message) => {
    const vehicleInfo = extractVehicleInfo(message);

    if (vehicleInfo.make && vehicleInfo.model && vehicleInfo.year) {
      setRegistrationState({
        ...registrationState,
        ...vehicleInfo,
        step: 'collecting_details'
      });

      return `Great! I can help you register your ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}.

I need to collect some additional information. Let me ask you a few questions:

1. What's your CNIC number? (Format: 35202-1234567-8)`;
    }

    return AI_RESPONSES.REGISTRATION_GUIDE;
  };

  const handleGeneralQuestions = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('documents') || lowerMessage.includes('required')) {
      return AI_RESPONSES.DOCUMENTS_REQUIRED;
    }

    if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return AI_RESPONSES.FEES_INFO;
    }

    if (lowerMessage.includes('process') || lowerMessage.includes('steps')) {
      return AI_RESPONSES.PROCESS_STEPS;
    }

    return "I can help you with vehicle registration, document requirements, fees, and the registration process. What specific information do you need?";
  };

  const handleFieldSpecificQuestions = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('cnic')) {
      return `Your CNIC (Computerized National Identity Card) is required for vehicle registration.

📍 Where to find it:
• Physical card issued by NADRA
• Format: 35202-1234567-8 (example)
• 13 digits with hyphens

Please provide your CNIC number to continue.`;
    }

    if (lowerMessage.includes('engine')) {
      return `The Engine Number is a unique identifier for your vehicle's engine.

🔧 Where to find it:
• On the engine block (usually near the top)
• In your vehicle's manual
• Sometimes visible when you open the hood
• Usually 6-8 characters (letters and numbers)

Please provide the engine number.`;
    }

    if (lowerMessage.includes('chassis')) {
      return `The Chassis Number is your vehicle's unique frame identifier.

🚗 Where to find it:
• Driver's side door frame
• Under the hood on the firewall
• Vehicle registration documents
• Usually 17 characters (letters and numbers)

Please provide the chassis number.`;
    }

    if (lowerMessage.includes('taxtron')) {
      return `TaxTron is a comprehensive platform designed to streamline vehicle-related processes such as registration, inspections, ownership transfers, and tax payments. By leveraging blockchain technology, TaxTron ensures secure, transparent, and tamper-proof transactions. The platform also supports NFT minting for vehicles, providing a unique digital representation of ownership.`;
    }

    return "I can help you find specific vehicle information. What field are you looking for?";
  };

  const handleRegistrationDataCollection = (message) => {
    // Extract CNIC (format: 35202-1234567-8)
    const cnicMatch = message.match(/\b\d{5}-\d{7}-\d\b/);
    if (cnicMatch && !registrationState.cnic) {
      setRegistrationState(prev => ({ ...prev, cnic: cnicMatch[0] }));
      return `Great! CNIC: ${cnicMatch[0]}

Now I need the engine number. You can find this on your vehicle's engine block.`;
    }

    // Extract engine number (6-8 alphanumeric characters)
    const engineMatch = message.match(/\b[A-Z0-9]{6,8}\b/i);
    if (engineMatch && !registrationState.engineNumber) {
      setRegistrationState(prev => ({ ...prev, engineNumber: engineMatch[0] }));
      return `Perfect! Engine number: ${engineMatch[0]}

Next, I need the chassis number. This is usually on the driver's side door frame.`;
    }

    // Extract chassis number (17 alphanumeric characters)
    const chassisMatch = message.match(/\b[A-Z0-9]{17}\b/i);
    if (chassisMatch && !registrationState.chassisNumber) {
      setRegistrationState(prev => ({ ...prev, chassisNumber: chassisMatch[0] }));
      return `Excellent! Chassis number: ${chassisMatch[0]}

I now have all the information needed to start your registration!`;
    }

    // If we have all required fields, update state
    if (registrationState.cnic && registrationState.engineNumber && registrationState.chassisNumber) {
      setRegistrationState(prev => ({ ...prev, step: 'ready_to_register' }));
    }

    return "I'm collecting information for your vehicle registration. Please provide the requested details one by one.";
  };

  const extractVehicleInfo = (message) => {
    const info = {};

    // Extract year (4-digit year)
    const yearMatch = message.match(VEHICLE_PATTERNS.YEAR);
    if (yearMatch) info.year = yearMatch[0];

    // Extract make and model (common patterns)
    for (const pattern of VEHICLE_PATTERNS.MAKE_MODEL) {
      const match = message.match(pattern);
      if (match) {
        info.make = match[1];
        info.model = match[2];
        break;
      }
    }

    return info;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    // Add user message
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Process message and get AI response
      const aiResponse = await processUserMessage(userMessage);

      // Add AI response
      const botMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

      // Check if we have enough info to start registration
      if (registrationState.step === 'collecting_details' &&
          registrationState.cnic &&
          registrationState.engineNumber &&
          registrationState.chassisNumber) {

        const completeMsg = {
          id: Date.now() + 2,
          type: 'bot',
          content: `Perfect! I have all the information needed to start your registration:

🚗 Vehicle: ${registrationState.year} ${registrationState.make} ${registrationState.model}
🆔 CNIC: ${registrationState.cnic}
🔧 Engine: ${registrationState.engineNumber}
🚗 Chassis: ${registrationState.chassisNumber}

Would you like me to start the registration process now?`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, completeMsg]);
        setRegistrationState({ ...registrationState, step: 'ready_to_register' });
      }

    } catch (error) {
      console.error('Error processing message:', error);

      const errorMsg = {
        id: Date.now() + 1,
        type: 'bot',
        content: "I'm sorry, I encountered an error processing your message. Please try again or contact support if the issue persists.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRegistration = () => {
    if (onStartRegistration && registrationState.step === 'ready_to_register') {
      onStartRegistration(registrationState);
      onClose();
    }
  };

  // Knowledge base for the chatbot
  const knowledgeBase = {
    "what is taxtron": "TaxTron is a comprehensive platform designed to streamline vehicle-related processes such as registration, inspections, ownership transfers, and tax payments. By leveraging blockchain technology, TaxTron ensures secure, transparent, and tamper-proof transactions. The platform also supports NFT minting for vehicles, providing a unique digital representation of ownership.",
    "tell me about taxtron": "TaxTron is a blockchain-based platform that simplifies vehicle management, including registration, taxation, and ownership transfers. It also supports NFT minting for vehicles.",
    "describe taxtron": "TaxTron is a platform that uses blockchain technology to manage vehicle-related processes securely and transparently. It includes modules for registration, taxation, and NFT minting.",
    "how to register a vehicle": "To register a vehicle, go to the Vehicle Registration module, fill in the required details, and submit the form.",
    "how to pay taxes": "To pay taxes, navigate to the Taxation module, select your vehicle, and complete the payment process.",
    "how to transfer ownership": "To transfer ownership, use the Ownership Transfer module, provide the new owner's details, and confirm the transfer.",
    "how to view owner history": "To view ownership history, go to the Ownership History module and search for the vehicle by its registration number.",
    "how to mint an nft": "To mint an NFT, navigate to the NFT Minting page, connect your wallet, and follow the instructions.",
    "what is blockchain": "Blockchain is a decentralized ledger technology used by TaxTron to ensure secure and transparent transactions.",
    "how to use taxtron": "TaxTron provides modules for vehicle registration, taxation, ownership transfer, and NFT minting. Navigate through the dashboard to access these features.",
    "what is nft": "An NFT (Non-Fungible Token) is a unique digital asset representing ownership of a specific item, such as a vehicle in TaxTron.",
  };

  // Function to get an answer from the knowledge base
  const getAnswer = (query) => {
    const lowerQuery = query.toLowerCase();
    for (const question in knowledgeBase) {
      if (lowerQuery.includes(question) || question.includes(lowerQuery)) {
        return knowledgeBase[question];
      }
    }
    return "I'm sorry, I don't have an answer for that. Please try asking something else.";
  };

  // Handle user input submission
  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const userMessage = { sender: "user", text: inputMessage };
    const botResponse = { sender: "bot", text: getAnswer(inputMessage) };

    setMessages([...messages, userMessage, botResponse]);
    setInputMessage("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 transform hover:scale-110"
          title="Chat with TAXTRO"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-96 h-[500px] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">TAXTRO</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="hover:bg-green-700 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-green-400 to-green-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-line">{message.content}</div>
                  <div className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-green-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black placeholder-gray-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* Registration Action Button */}
            {registrationState.step === 'ready_to_register' && (
              <button
                onClick={startRegistration}
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                🚀 Start Registration Process
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatSupport;
