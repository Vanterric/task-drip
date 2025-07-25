export default async (request, context) => {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";

  const botSignatures = [
    "googlebot",
    "bingbot",
    "duckduckbot",
    "slurp",
    "yandex",
    "baiduspider",
    "chatgpt-user",
    "gptbot"
  ];

  const isBot = botSignatures.some(bot => userAgent.includes(bot));

  if (isBot) {
    return Response.redirect(new URL("/login-bot.html", request.url), 301);
  }

  // Let humans proceed normally
  return context.next();
};
