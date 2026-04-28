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

  let text = "\u{1F4CB} \u041D\u043E\u0432\u0430\u044F \u0437\u0430\u044F\u0432\u043A\u0430 (\u0441 \u0433\u043B\u0430\u0432\u043D\u043E\u0439)!\n\n";
  text += "\u{1F464} \u0418\u043C\u044F: " + name + "\n";
  text += "\u{1F4DE} \u0422\u0435\u043B\u0435\u0444\u043E\u043D: " + phone + "\n";
  text += "\u{1F476} \u0412\u043E\u0437\u0440\u0430\u0441\u0442 \u0440\u0435\u0431\u0451\u043D\u043A\u0430: " + age;
  if (format) text += "\n\u{1F4DA} \u0424\u043E\u0440\u043C\u0430\u0442: " + format;
  if (note) text += "\n\u{1F4AC} \u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439: " + note;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const payloadObj = { chat_id: chatId, text: text };
  const payloadBuf = Buffer.from(JSON.stringify(payloadObj), "utf8");

  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: "/bot" + token + "/sendMessage",
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": payloadBuf.length,
      },
    }, (res) => { res.on("data", () => {}); res.on("end", resolve); });
    req.on("error", reject);
    req.write(payloadBuf);
    req.end();
  });

  return { statusCode: 200, body: "ok" };
};
