const https = require("https");

exports.handler = async function (event) {
  const payload = JSON.parse(event.body);
  const { data, form_name, number } = payload;

  const name = data.name || "не указано";
  const phone = data.phone || "не указано";
  const age = data.age || "не указано";

  const formLabel = form_name === "contact-news" ? "со статьи" : "с главной";

  const text =
    `📋 Заявка #${number} (${formLabel})\n\n` +
    `👤 Имя: ${name}\n` +
    `📞 Телефон: ${phone}\n` +
    `🧒 Возраст ребёнка: ${age}`;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const body = JSON.stringify({ chat_id: chatId, text });

  await new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "api.telegram.org",
        path: `/bot${token}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", resolve);
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });

  return { statusCode: 200 };
};
