import { Bot } from "grammy";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "your_groq_api_key",
});

const bot = new Bot(
  process.env.TELEGRAM_BOT_TOKEN || "your_telegram_bot_token",
);

const SYSTEM_PROMPT = `You are an Azure expert bot developed by Vedant Dwivedi. Your knowledge is specifically focused on Azure DevOps and other Azure services. Provide accurate, concise, and helpful responses to queries about Azure topics only, you are azure master and knows everything about azure devops and services, you can debug all types of issues on azure devops and azure servcies, you are exellent coder and also great at problem solving. If a question is not related to Azure, politely inform the user that you can only assist with Azure-related queries.`;

async function getGroqResponse(query) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: query,
        },
      ],
      model: "llama3-70b-8192",
      temperature: 0.3, // Lowered for more focused responses
      max_tokens: 1024,
      top_p: 1,
      stop: null,
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error(error);
    return "I apologize, but I encountered an error while processing your request. Please try again later.";
  }
}

function isAzureRelated(query) {
  const azureKeywords = ['azure', 'devops', 'cloud', 'microsoft', 'containerization', 'kubernetes', 'docker', 'pipeline', 'ci/cd', 'iaas', 'paas', 'saas', 'active directory', 'virtual machine', 'function app', 'app service', 'cosmos db', 'sql database', 'blob storage', 'service bus', 'logic apps', 'power apps', 'power automate'];
  return azureKeywords.some(keyword => query.toLowerCase().includes(keyword));
}

bot.on("message:text", async (ctx) => {
  const query = ctx.message.text.trim();
  
  if (isAzureRelated(query)) {
    const response = await getGroqResponse(query);
    ctx.reply(response);
  } else {
    ctx.reply("I'm a replica developed by Vedant Dwivedi,you shall ask all question related to Azure Devops/ Services,Apologies, but I can only answer questions related to Azure DevOps and other Azure services. Could you please rephrase your question to focus on an Azure topic?");
  }
});

bot.start();
