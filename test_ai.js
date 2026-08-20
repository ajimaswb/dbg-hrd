import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
const hrTools = {
  functionDeclarations: [
    {
      name: "tambahKaryawan",
      description: "Tambah karyawan",
      parameters: { type: "OBJECT", properties: { name: { type: "STRING" } }, required: ["name"] }
    }
  ]
};
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest", tools: [hrTools] });

async function run() {
  const currentHistory = [];
  currentHistory.push({ role: 'user', parts: [{ text: "Tolong tambah karyawan bernama Budi" }] });

  try {
    let result = await model.generateContent({ contents: currentHistory });
    currentHistory.push({ role: 'model', parts: result.response.candidates[0].content.parts });
    
    let calls = result.response.functionCalls();
    
    if (calls && calls.length > 0) {
       const functionResponses = [];
       for (const call of calls) {
         functionResponses.push({
           functionResponse: { name: call.name, response: { success: true } }
         });
       }
       currentHistory.push({ role: 'user', parts: functionResponses });
       result = await model.generateContent({ contents: currentHistory });
       console.log(result.response.text());
    } else {
       console.log(result.response.text());
    }
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}
run();
