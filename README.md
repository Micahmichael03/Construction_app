# Construction AI Object Detection System

A production-ready AI-powered construction object detection and cost estimation system built with FastAPI backend and modern web frontend.

## 🏗️ Features

- **Object Detection**: Uses YOLOv8 to detect construction objects in images
- **Cost Estimation**: Provides detailed cost breakdown with supplier links
- **AI-Powered Q&A**: Azure OpenAI GPT integration for intelligent recommendations
- **Camera Capture**: Browser-based camera capture functionality
- **File Upload**: Drag & drop or click to upload images
- **Responsive Design**: Modern, mobile-friendly UI
- **Production Ready**: Docker support, security, and scalability

## 🏗️ Architecture

```
┌─────────────────┐    HTTP/HTTPS    ┌─────────────────┐
│   Web Frontend  │ ◄──────────────► │  FastAPI Backend│
│   (HTML/CSS/JS) │                  │                 │
└─────────────────┘                  └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   AI Services   │
                                    │                 │
                                    │ • YOLOv8 Model  │
                                    │ • Azure OpenAI  │
                                    │ • Cost Database │
                                    └─────────────────┘
```

## 📁 Project Structure

```
Object_Face_Detection/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile          # Container configuration
│   └── env.example         # Environment variables template
├── frontend/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # CSS styling
│   └── script.js           # JavaScript functionality
├── yolov8n.pt              # YOLOv8 model file
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js (for development server)
- Docker (optional)
- Azure OpenAI API key

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd Object_Face_Detection/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your Azure OpenAI credentials
   ```

5. **Copy YOLO model:**
   ```bash
   cp ../yolov8n.pt .
   ```

6. **Run the server:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd Object_Face_Detection/frontend
   ```

2. **Serve the frontend:**
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Or using Node.js
   npx serve .
   ```

3. **Open in browser:**
   ```
   http://localhost:8080
   ```

## 🐳 Docker Deployment

### Backend Container

```bash
# Build the image
docker build -t construction-ai-backend ./backend

# Run the container
docker run -p 8000:8000 \
  -e AZURE_API_KEY=your_key \
  -e AZURE_ENDPOINT=your_endpoint \
  -e AZURE_DEPLOYMENT=your_deployment \
  construction-ai-backend
```

### Frontend Container

```bash
# Build the image
docker build -t construction-ai-frontend ./frontend

# Run the container
docker run -p 8080:80 construction-ai-frontend
```

### Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - AZURE_API_KEY=${AZURE_API_KEY}
      - AZURE_ENDPOINT=${AZURE_ENDPOINT}
      - AZURE_DEPLOYMENT=${AZURE_DEPLOYMENT}
    volumes:
      - ./yolov8n.pt:/app/yolov8n.pt

  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
```

Run with:
```bash
docker-compose up -d
```

## 🔧 API Endpoints

### Base URL: `http://localhost:8000`

#### 1. Health Check
```http
GET /health
```

#### 2. Object Detection
```http
POST /detect
Content-Type: multipart/form-data
Authorization: Bearer your_api_key

Body:
- file: image file
```

**Response:**
```json
{
  "success": true,
  "detected_objects": {
    "hammer": 2,
    "drill": 1
  },
  "annotated_image": "base64_encoded_image",
  "cost_breakdown": [
    {
      "object": "Hammer",
      "quantity": 2,
      "unit_cost": 25.0,
      "total_cost": 50.0,
      "supplier": "https://homedepot.com/hammer"
    }
  ],
  "total_cost": 50.0,
  "recommendations": "🔨 Hammer: Store in a dry, secure location..."
}
```

#### 3. Q&A
```http
POST /qa
Content-Type: multipart/form-data
Authorization: Bearer your_api_key

Body:
- file: image file
- question: "What do you see in this image?"
```

**Response:**
```json
{
  "success": true,
  "answer": "I can see construction tools including hammers and drills..."
}
```

#### 4. Get Construction Items
```http
GET /items
Authorization: Bearer your_api_key
```

## 🔐 Security

### API Key Authentication

The API uses Bearer token authentication. Set your API key in the frontend:

```javascript
const API_KEY = 'your_api_key_here';
```

### Environment Variables

Required environment variables:

```bash
# Azure OpenAI
AZURE_API_KEY=your_azure_openai_api_key
AZURE_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_DEPLOYMENT=your_deployment_name

# API Security
API_KEY=your_api_key_here

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=False
```

## 🎯 Usage Examples

### 1. Upload and Analyze Image

1. Open the web application
2. Drag & drop an image or click to browse
3. Wait for analysis to complete
4. View detected objects, cost breakdown, and recommendations

### 2. Camera Capture

1. Click "Start Camera" to enable camera access
2. Position camera to capture construction scene
3. Click "Capture Image" to take photo
4. Analyze the captured image

### 3. Ask Questions

1. After analyzing an image, scroll to Q&A section
2. Type your question (e.g., "How can I save money on these tools?")
3. Click "Ask" to get AI-powered response

## 🛠️ Development

### Backend Development

```bash
# Install development dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest 

# Format code
black main.py
```

### Frontend Development

```bash
# Serve with live reload
npx live-server --port=8080

# Or use Python
python -m http.server 8080
```

## 📊 Performance Optimization

### Backend

- Use async endpoints for I/O operations
- Implement caching for model predictions
- Use connection pooling for database
- Enable gzip compression

### Frontend

- Optimize image sizes before upload
- Implement lazy loading for results
- Use service workers for caching
- Minify CSS/JS for production

## 🔍 Troubleshooting

### Common Issues

1. **Camera not working:**
   - Ensure HTTPS or localhost
   - Check browser permissions
   - Try different browser

2. **Model loading failed:**
   - Verify yolov8n.pt file exists
   - Check file permissions
   - Ensure sufficient memory

3. **Azure OpenAI errors:**
   - Verify API key and endpoint
   - Check deployment name
   - Ensure quota limits

4. **CORS errors:**
   - Update CORS settings in backend
   - Check frontend URL configuration

### Logs

Backend logs are available at:
```bash
# Development
uvicorn main:app --log-level debug

# Production
docker logs construction-ai-backend
```

## 🚀 Production Deployment

### Cloud Deployment Options

1. **Azure:**
   - Azure App Service for backend
   - Azure Static Web Apps for frontend
   - Azure Container Registry for Docker images

2. **AWS:**
   - AWS ECS for backend
   - AWS S3 + CloudFront for frontend
   - AWS ECR for Docker images

3. **Google Cloud:**
   - Cloud Run for backend
   - Firebase Hosting for frontend
   - Container Registry for Docker images

### Environment Variables for Production

```bash
# Production settings
DEBUG=False
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=["https://yourdomain.com"]

# Security
API_KEY=your_secure_api_key
AZURE_API_KEY=your_azure_key
```

## 📈 Scaling Considerations

### Horizontal Scaling

- Use load balancer for multiple backend instances
- Implement Redis for session management
- Use CDN for static assets

### Database Scaling

- Consider PostgreSQL for cost data
- Implement caching layer
- Use read replicas for heavy queries

### AI Model Scaling

- Use GPU instances for YOLOv8
- Implement model serving with TensorFlow Serving
- Consider edge deployment for real-time processing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## 🔄 Updates

### Version 1.0.0
- Initial release with FastAPI backend
- Web frontend with camera capture
- YOLOv8 object detection
- Azure OpenAI integration
- Cost estimation system 

## 📱 How to Run and Access the App on Any Device Using LocalTunnel

This guide will help you set up the Construction AI app so it works on your phone, tablet, or any device, using LocalTunnel for easy access.

### 1. Prerequisites
- **Python 3.8+** (for backend)
- **Node.js** (for LocalTunnel and optional frontend server)
- **pip** (Python package manager)
- **npm** (Node.js package manager, comes with Node.js)

### 2. Install Dependencies

#### Backend
```bash

cd Object_Face_Detection/backend

python -m venv venv
# Activate the virtual environment:
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate



pip install -r requirements.txt

```

#### Frontend (optional for HTTPS server)
```bash
cd ../frontend
npm install -g http-server localtunnel
```

### 3. Start the Backend
```bash
cd Object_Face_Detection/backend
uvicorn main:app --host 0.0.0.0 --port 8000 # this is best
```

### 4. Start the Frontend
```bash
cd ../frontend
python -m http.server 8080 --bind 0.0.0.0

# Or for HTTPS (optional):
# http-server -S -C cert.pem -K key.pem -p 8080
```

### 5. Expose Both Servers with LocalTunnel

#### Backend
```bash
lt --port 8000
```
- Copy the public URL (e.g., `https://your-backend.loca.lt`).

#### Frontend
```bash
lt --port 8080
```
- Copy the public URL (e.g., `https://your-frontend.loca.lt`).

#### Note on LocalTunnel Passcode
- When you run the LocalTunnel command, it will give you a link, Input the link into your phone, IOS or tablets, it will land a page where it will require to get a passcode. there is a link below to get the passcode, Visit that link, copy the passcode, and use it to access the construction site from your device.

### 6. Update the Frontend Config
- Open `Object_Face_Detection/frontend/config.js`.
- Set the backend URL:
  ```js
  API_BASE_URL: 'https://your-backend.loca.lt'
  ```
  (Replace with your actual backend tunnel URL.)

### 7. Connect from Your Phone or Tablet
- **Make sure your laptop and your phone/tablet are on the same WiFi/network.**
- On your phone/tablet, open the frontend tunnel URL (e.g., `https://your-frontend.loca.lt`) in your browser.
- If prompted for a passcode, use the one provided by LocalTunnel.
- The app will now work on your device, using the backend tunnel for API calls.

### 8. Troubleshooting
- If you get a 'Failed to fetch' error, check that:
  - Both backend and frontend servers are running.
  - The correct LocalTunnel URLs are set in `frontend/config.js`.
  - Both devices are on the same network.
- If you get a certificate warning, proceed anyway (safe for local/demo use).

---

**Summary:**
- Install Python, Node.js, and dependencies.
- Start backend and frontend servers.
- Expose both with LocalTunnel and get the passcode link.
- Update `frontend/config.js` with the backend tunnel URL.
- Access the frontend tunnel URL from your phone/tablet (same network as laptop).
- Enjoy Construction AI on any device! 