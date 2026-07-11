import app from '../api/index';

if (!process.env.VERCEL) {
  const PORT = process.env.SERVER_PORT || 3001;
  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
  });
}

export default app;
