# Construction AI Backend

## 🚀 How to Run and Start the Backend

### Option 1: Run Without Docker (Recommended for Development)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Set up environment variables:**
   - Copy `env.example` to `.env` and fill in your Azure OpenAI credentials (optional for GPT features).
3. **Start the backend:**
   ```bash
   python main.py
   ```
4. **Access the API:**
   - Health check: [http://localhost:8000/health](http://localhost:8000/health)
   - API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Run With Docker Compose

1. **Install Docker Desktop** (includes Docker Compose):
   - [Download Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. **Start the backend:**
   ```bash
   docker-compose up -d
   ```
   or (for newer Docker):
   ```bash
   docker compose up -d
   ```
3. **If you get `'docker-compose' is not recognized` error:**
   - Install Docker Desktop and restart your terminal/PC.
   - Or use Option 1 above.

### ⚠️ Note on Accessing the API
- In your browser, always use `http://localhost:8000` or `http://127.0.0.1:8000` (not `0.0.0.0`).

--- 