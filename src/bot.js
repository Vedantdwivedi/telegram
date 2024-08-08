import { Bot } from "grammy";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "your_groq_api_key",
});

const bot = new Bot(
  process.env.TELEGRAM_BOT_TOKEN || "your_telegram_bot_token",
);

const SYSTEM_PROMPT = `You are an Azure expert bot developed by Vedant Dwivedi. Your knowledge is specifically focused on Azure DevOps and other Azure services. Provide accurate, concise, and helpful responses to queries about Azure topics only. You are an Azure master and know everything about Azure DevOps and services, you can debug all types of issues on Azure DevOps and Azure services, you are an excellent coder and also great at problem-solving. If a question is not related to Azure, politely inform the user that you can only assist with Azure-related queries.`;

let userContexts = {};

async function getGroqResponse(query, userId) {
  try {
    const userContext = userContexts[userId];
    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...userContext.history,
      {
        role: "user",
        content: query,
      },
    ];

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama3-70b-8192",
      temperature: 0.3,
      max_tokens: 1024,
      top_p: 1,
      stop: null,
    });

    const response = completion.choices[0].message.content;

    // Update user's conversation history
    userContext.history.push({ role: "user", content: query });
    userContext.history.push({ role: "assistant", content: response });

    // Limit history to last 10 messages (5 exchanges) to manage token usage
    if (userContext.history.length > 10) {
      userContext.history = userContext.history.slice(-10);
    }

    return response;
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
  const userId = ctx.message.from.id;

  if (!userContexts[userId]) {
    userContexts[userId] = { history: [], lastQueryWasAzureRelated: false };
  }

  if (isAzureRelated(query) || userContexts[userId].lastQueryWasAzureRelated) {
    const response = await getGroqResponse(query, userId);
    userContexts[userId].lastQueryWasAzureRelated = isAzureRelated(query);
    ctx.reply(response);
  } else {
    ctx.reply("I'm a bot developed by Vedant Dwivedi. Please ask questions related to Azure DevOps/Services. Apologies, but I can only answer questions related to Azure DevOps and other Azure services. Could you please rephrase your question to focus on an Azure topic?");
  }
});

bot.start();
