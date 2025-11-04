const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-pro", 
    "gemini-pro",
    "gemini-flash",
    "models/gemini-1.5-flash",
    "models/gemini-1.5-pro",
    "models/gemini-pro"
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`\nTrying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello");
      const response = await result.response;
      console.log(`✅ SUCCESS with ${modelName}: ${response.text().substring(0, 50)}`);
      break; // Stop on first success
    } catch (error) {
      console.log(`❌ FAILED with ${modelName}: ${error.message.substring(0, 100)}`);
    }
  }
}

testModels();
