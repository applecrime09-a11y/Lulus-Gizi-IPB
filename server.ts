import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { sql } from '@vercel/postgres';

// Initialize database (Postgres)
async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_progress (
        github_id BIGINT PRIMARY KEY,
        scores TEXT,
        current_day INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
  } catch (e) {
    console.error("Database init error:", e);
  }
}

initDB();

const app = express();
export default app; // Export for Vercel

async function startServer() {
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'gizi-ipb-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // --- GitHub OAuth Routes ---

  app.get('/api/auth/github/url', (req, res) => {
    const client_id = process.env.GITHUB_CLIENT_ID;
    if (!client_id) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID not configured' });
    }
    
    // Use the injected APP_URL for redirect_uri
    const redirect_uri = `${process.env.APP_URL}/api/auth/github/callback`;
    
    const githubUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=read:user`;
    res.json({ url: githubUrl });
  });

  app.get('/api/auth/github/callback', async (req: any, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).send('No code provided');
    }

    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { Accept: 'application/json' }
      });

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        throw new Error('Failed to obtain access token');
      }

      // Get user info
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Store user in session
      req.session.user = {
        id: userResponse.data.id,
        login: userResponse.data.login,
        name: userResponse.data.name,
        avatar_url: userResponse.data.avatar_url,
      };

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Login Berhasil! Menutup jendela...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('GitHub OAuth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/progress', async (req: any, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    try {
      const { rows } = await sql`SELECT * FROM user_progress WHERE github_id = ${user.id}`;
      if (rows.length > 0) {
        res.json({
          scores: JSON.parse(rows[0].scores),
          currentDay: rows[0].current_day
        });
      } else {
        res.json({ scores: null, currentDay: 1 });
      }
    } catch (err) {
      console.error('Fetch progress error:', err);
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  });

  app.post('/api/progress', async (req: any, res) => {
    const user = req.session.user;
    if (!user) return res.status(401).json({ error: 'Not authenticated' });

    const { scores, currentDay } = req.body;
    
    try {
      await sql`
        INSERT INTO user_progress (github_id, scores, current_day, updated_at)
        VALUES (${user.id}, ${JSON.stringify(scores)}, ${currentDay}, CURRENT_TIMESTAMP)
        ON CONFLICT (github_id) DO UPDATE SET
          scores = EXCLUDED.scores,
          current_day = EXCLUDED.current_day,
          updated_at = CURRENT_TIMESTAMP
      `;
      res.json({ success: true });
    } catch (err) {
      console.error('Save progress error:', err);
      res.status(500).json({ error: 'Failed to save progress' });
    }
  });

  app.get('/api/auth/me', (req: any, res) => {
    const user = req.session.user;
    if (user) {
      res.json({ user });
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });

  app.post('/api/auth/logout', (req: any, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
