/* ============================================================
   Yandex Cloud Function — приём заявки с лендинга и отправка
   письма через Yandex Cloud Postbox.

   Точка входа (Entrypoint в консоли):  index.handler
   Среда выполнения (Runtime):          nodejs18 (или новее)
   Зависимостей нет — fetch встроен в Node 18+.

   Письмо отправляется по IAM-токену сервисного аккаунта самой
   функции (context.token) — поэтому в коде НЕТ секретных ключей.
   Сервисному аккаунту функции нужно выдать роль postbox.sender.

   Переменные окружения функции (задаются в консоли):
     SENDER     — подтверждённый в Postbox адрес отправителя
                  (например  noreply@твойдомен.ru)
     RECIPIENT  — твоя почта, куда падают заявки
                  (например  andrey@yandex.ru)
   ============================================================ */

const POSTBOX_URL = 'https://postbox.cloud.yandex.net/v2/email/outbound-emails';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function reply(statusCode, bodyObj) {
  return {
    statusCode,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify(bodyObj)
  };
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

exports.handler = async (event, context) => {
  // Предзапрос браузера (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return reply(405, { ok: false, error: 'Method not allowed' });
  }

  // Разбор тела запроса
  let data = {};
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : (event.body || '');
    data = JSON.parse(raw || '{}');
  } catch (e) {
    return reply(400, { ok: false, error: 'Bad JSON' });
  }

  const name  = String(data.name  || '').trim().slice(0, 200);
  const phone = String(data.phone || '').trim().slice(0, 200);
  const goal  = String(data.goal  || '').trim().slice(0, 2000);
  const page  = String(data.page  || '').trim().slice(0, 500);

  if (!name || !phone) {
    return reply(400, { ok: false, error: 'Missing name or phone' });
  }

  // IAM-токен сервисного аккаунта функции
  const token = context && context.token && context.token.access_token;
  if (!token) {
    return reply(500, { ok: false, error: 'No service account token. Привяжи сервисный аккаунт к функции.' });
  }

  const SENDER    = process.env.SENDER;
  const RECIPIENT = process.env.RECIPIENT;
  if (!SENDER || !RECIPIENT) {
    return reply(500, { ok: false, error: 'SENDER / RECIPIENT не заданы в переменных окружения функции.' });
  }

  const textBody =
    'Новая заявка с лендинга\n\n' +
    'Имя: ' + name + '\n' +
    'Телефон/мессенджер: ' + phone + '\n' +
    'Цель: ' + (goal || '—') + '\n' +
    (page ? ('\nСтраница: ' + page + '\n') : '') +
    '\nВремя: ' + new Date().toISOString();

  const htmlBody =
    '<div style="font-family:Arial,sans-serif;font-size:15px;color:#222">' +
    '<h2 style="margin:0 0 12px">Новая заявка с лендинга</h2>' +
    '<p><b>Имя:</b> ' + esc(name) + '</p>' +
    '<p><b>Телефон/мессенджер:</b> ' + esc(phone) + '</p>' +
    '<p><b>Цель:</b> ' + (goal ? esc(goal) : '—') + '</p>' +
    (page ? '<p style="color:#888"><b>Страница:</b> ' + esc(page) + '</p>' : '') +
    '<p style="color:#888;font-size:13px">' + new Date().toLocaleString('ru-RU') + '</p>' +
    '</div>';

  const payload = {
    FromEmailAddress: SENDER,
    Destination: { ToAddresses: [RECIPIENT] },
    // ReplyTo не указываем — в phone обычно не email; при желании можно добавить
    Content: {
      Simple: {
        Subject: { Data: 'Заявка с сайта — ' + name, Charset: 'UTF-8' },
        Body: {
          Text: { Data: textBody, Charset: 'UTF-8' },
          Html: { Data: htmlBody, Charset: 'UTF-8' }
        }
      }
    }
  };

  let resp;
  try {
    resp = await fetch(POSTBOX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-YaCloud-SubjectToken': token
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    return reply(502, { ok: false, error: 'Network error: ' + e.message });
  }

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    return reply(502, { ok: false, error: 'Postbox ' + resp.status + ': ' + t });
  }

  return reply(200, { ok: true });
};
