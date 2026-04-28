const https = require("https");

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    const params = new URLSearchParams(event.body);
    body = Object.fromEntries(params);
  }

  const name = body.name || "не указано";
  const phone = body.phone || "не указано";
  const age = body.age || "не указано";
  const format = body.format || "";
  const note = body.note || "";

  let text = `📋 Новая заявка (с главной)!\n\n👤 Имя: ${name}\n📞 Телефон: ${phone}\n👶 Возраст ребёнка: ${age}`;
  if (format) text += `\n📚 Формат: ${format}`;
  if (note) text += `\n💬 Комментарий: ${note}`;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const payload = JSON.stringify({ chat_id: chatId, text });

  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${token}/sendMessage`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) },
    }, (res) => { res.on("data", () => {}); res.on("end", resolve); });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });

  return { statusCode: 200, body: "ok" };
};
