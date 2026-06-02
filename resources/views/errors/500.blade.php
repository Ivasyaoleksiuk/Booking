<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Помилка сервера — {{ config('app.name') }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { text-align: center; padding: 3rem 2rem; max-width: 400px; }
        .code { font-size: 6rem; font-weight: 800; color: #e5e7eb; line-height: 1; }
        h1 { font-size: 1.5rem; font-weight: 700; color: #111827; margin: 1rem 0 0.5rem; }
        p { color: #6b7280; margin-bottom: 2rem; }
        a { display: inline-block; background: #111827; color: #fff; padding: 0.75rem 2rem; border-radius: 0.5rem; text-decoration: none; font-weight: 500; }
        a:hover { background: #374151; }
    </style>
</head>
<body>
    <div class="card">
        <div class="code">500</div>
        <h1>Щось пішло не так</h1>
        <p>Сталася помилка сервера. Ми вже працюємо над її виправленням.</p>
        <a href="/">На головну</a>
    </div>
</body>
</html>
