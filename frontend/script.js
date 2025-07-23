// Configuration
const { API_BASE_URL } = typeof CONFIG !== 'undefined' ? CONFIG : window.CONFIG;

// Azure OpenAI Configuration (from tested2.py)
const { AZURE_API_KEY, AZURE_ENDPOINT, AZURE_DEPLOYMENT } = typeof CONFIG !== 'undefined' ? CONFIG : window.CONFIG;

// Dark Mode Configuration
const DARK_MODE_KEY = 'construction-ai-dark-mode';

// Global variables
let stream = null;
let cameraImageBlob = null;
let uploadImageBlob = null;
let currentImage = null;
let cameraResults = null;
let uploadResults = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const startCameraBtn = document.getElementById('startCamera');
const stopCameraBtn = document.getElementById('stopCamera');
const captureImageBtn = document.getElementById('captureImage');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const questionInput = document.getElementById('questionInput');
const askQuestionBtn = document.getElementById('askQuestion');
const analyzeCameraImageBtn = document.getElementById('analyzeCameraImage');
const cameraResultsSection = document.getElementById('cameraResultsSection');
const cameraQaSection = document.getElementById('cameraQaSection');
const analyzeUploadImageBtn = document.getElementById('analyzeUploadImage');
const uploadResultsSection = document.getElementById('uploadResultsSection');
const uploadQaSection = document.getElementById('uploadQaSection');
const cameraPreviewArea = document.getElementById('cameraPreviewArea');
const cameraPreviewImg = document.getElementById('cameraPreviewImg');
const darkModeToggle = document.getElementById('darkModeToggle');

// Dark Mode Functions
function initDarkMode() {
    const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
    if (savedDarkMode === 'true') {
        enableDarkMode();
    }
}

function toggleDarkMode() {
    if (document.body.classList.contains('dark-mode')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem(DARK_MODE_KEY, 'true');
    updateDarkModeIcon(true);
}

function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem(DARK_MODE_KEY, 'false');
    updateDarkModeIcon(false);
}

function updateDarkModeIcon(isDark) {
    const icon = darkModeToggle.querySelector('.toggle-icon');
    if (isDark) {
        icon.className = 'fas fa-sun toggle-icon';
    } else {
        icon.className = 'fas fa-moon toggle-icon';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded fired'); // DEBUG
    initDarkMode();
    setupEventListeners();
    setupDragAndDrop();
});

function setupEventListeners() {
    // DEBUG: Check if analyzeCameraImageBtn exists
    console.log('analyzeCameraImageBtn:', analyzeCameraImageBtn);
    
    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);
    
    // File upload
    fileInput.addEventListener('change', handleFileSelect);
    
    // Camera controls
    startCameraBtn.addEventListener('click', startCamera);
    stopCameraBtn.addEventListener('click', stopCamera);
    captureImageBtn.addEventListener('click', captureImage);
    
    // Q&A
    askQuestionBtn.addEventListener('click', askQuestion);
    questionInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            askQuestion();
        }
    });

    // New camera flow
    analyzeCameraImageBtn.addEventListener('click', async function() {
        console.log('Analyze Captured Image button clicked'); // DEBUG
        // Ensure a captured image exists
        if (!cameraImageBlob) {
            showError('No captured image to analyze.');
            return;
        }
        // Show loading state
        cameraResultsSection.innerHTML = '';
        cameraResultsSection.style.display = 'block';
        cameraResultsSection.innerHTML = loadingResultsHTML();
        cameraQaSection.style.display = 'none';
        cameraQaSection.innerHTML = '';
        try {
            // Prepare file for backend
            const file = new File([cameraImageBlob], 'captured-image.jpg', { type: 'image/jpeg' });
            // Call backend
            const data = await analyzeImageAPI(file);
            console.log('Camera analysis response:', data); // Debug log
            cameraResults = data;
            // Always show results, even if no objects detected
            cameraResultsSection.innerHTML = renderResults(data, cameraPreviewImg.src);
            if (data.success) {
                renderChatSection(cameraQaSection, file, data);
            } else {
                cameraResultsSection.innerHTML = `<div class='error-message'>${data.error || 'Analysis failed.'}</div>`;
            }
        } catch (error) {
            console.error('Camera analysis error:', error);
            cameraResultsSection.innerHTML = `<div class='error-message'>${error.message}</div>`;
        }
    });

    // Upload flow
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            uploadImageBlob = file;
            analyzeUploadImageBtn.style.display = 'inline-block';
        }
    });

    // Upload analyze button event listener is now handled in handleFile() function
}

function setupDragAndDrop() {
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
}

// File handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please select an image file.');
        return;
    }
    
    // Store the file for upload analysis
    uploadImageBlob = file;
    
    // Create preview URL and show image
    const previewUrl = URL.createObjectURL(file);
    
    // Create or update upload preview area
    let uploadPreviewArea = document.getElementById('uploadPreviewArea');
    if (!uploadPreviewArea) {
        uploadPreviewArea = document.createElement('div');
        uploadPreviewArea.id = 'uploadPreviewArea';
        uploadPreviewArea.className = 'upload-preview-area';
        uploadPreviewArea.style.cssText = 'margin-top: 1.5rem; display: block;';
        uploadPreviewArea.innerHTML = `
            <h3>Uploaded Image Preview</h3>
            <img id="uploadPreviewImg" src="" alt="Uploaded Preview" style="max-width: 100%; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        `;
        
        // Insert after upload area
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.parentNode.insertBefore(uploadPreviewArea, uploadArea.nextSibling);
    }
    
    // Update the preview image
    const uploadPreviewImg = document.getElementById('uploadPreviewImg');
    if (uploadPreviewImg) {
        uploadPreviewImg.src = previewUrl;
    }
    
    // Show the analyze button for upload
    const analyzeUploadBtn = document.getElementById('analyzeUploadImage');
    if (analyzeUploadBtn) {
        analyzeUploadBtn.style.display = 'inline-block';
        
        // Remove previous event listeners by replacing the node
        const newAnalyzeBtn = analyzeUploadBtn.cloneNode(true);
        analyzeUploadBtn.parentNode.replaceChild(newAnalyzeBtn, analyzeUploadBtn);
        
        // Add new event listener
        newAnalyzeBtn.addEventListener('click', async function() {
            console.log('Analyze Uploaded Image button clicked'); // DEBUG
            if (!uploadImageBlob) {
                showError('No uploaded image to analyze.');
                return;
            }
            
            const uploadResultsSection = document.getElementById('uploadResultsSection');
            const uploadQaSection = document.getElementById('uploadQaSection');
            
            uploadResultsSection.innerHTML = '';
            uploadResultsSection.style.display = 'block';
            uploadResultsSection.innerHTML = loadingResultsHTML();
            uploadQaSection.style.display = 'none';
            uploadQaSection.innerHTML = '';
            
            try {
                const data = await analyzeImageAPI(uploadImageBlob);
                console.log('Upload analysis response:', data); // Debug log
                uploadResults = data;
                uploadResultsSection.innerHTML = renderResults(data, previewUrl);
                if (data.success) {
                    renderChatSection(uploadQaSection, uploadImageBlob, data);
                } else {
                    uploadResultsSection.innerHTML = `<div class='error-message'>${data.error || 'Analysis failed.'}</div>`;
                }
            } catch (error) {
                console.error('Upload analysis error:', error);
                uploadResultsSection.innerHTML = `<div class='error-message'>${error.message}</div>`;
            }
        });
    }
    
    // Clear previous results
    const uploadResultsSection = document.getElementById('uploadResultsSection');
    const uploadQaSection = document.getElementById('uploadQaSection');
    if (uploadResultsSection) {
        uploadResultsSection.style.display = 'none';
        uploadResultsSection.innerHTML = '';
    }
    if (uploadQaSection) {
        uploadQaSection.style.display = 'none';
        uploadQaSection.innerHTML = '';
    }
    
    showSuccess('Image uploaded successfully. Click "Analyze Uploaded Image" to process.');
}

// Camera functions
async function startCamera() {
    try {
        let constraints = {
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: { exact: 'environment' }
            } 
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        startCameraBtn.disabled = true;
        stopCameraBtn.disabled = false;
        captureImageBtn.disabled = false;
        showSuccess('Camera started successfully');
    } catch (error) {
        // If facingMode: { exact: 'environment' } fails, fallback to default camera
        try {
            let fallbackConstraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            video.srcObject = stream;
            startCameraBtn.disabled = true;
            stopCameraBtn.disabled = false;
            captureImageBtn.disabled = false;
            showSuccess('Camera started (default)');
        } catch (fallbackError) {
        showError('Failed to start camera. Please check permissions.');
        }
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        video.srcObject = null;
    }
    
    startCameraBtn.disabled = false;
    stopCameraBtn.disabled = true;
    captureImageBtn.disabled = true;
    
    showSuccess('Camera stopped');
}

function captureImage() {
    if (!stream) {
        showError('Camera is not running');
        return;
    }
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    canvas.toBlob(function(blob) {
        cameraImageBlob = blob;
        // Show preview
        const previewUrl = URL.createObjectURL(blob);
        cameraPreviewImg.src = previewUrl;
        cameraPreviewArea.style.display = 'block';
        // Show and re-attach event handler to the analyze button
        const analyzeBtn = document.getElementById('analyzeCameraImage');
        analyzeBtn.style.display = 'inline-block';
        // Remove previous event listeners by replacing the node
        const newAnalyzeBtn = analyzeBtn.cloneNode(true);
        analyzeBtn.parentNode.replaceChild(newAnalyzeBtn, analyzeBtn);
        newAnalyzeBtn.addEventListener('click', async function() {
            console.log('Analyze Captured Image button clicked'); // DEBUG
            if (!cameraImageBlob) {
                showError('No captured image to analyze.');
                return;
            }
            // API key check removed since we disabled authentication in backend
            cameraResultsSection.innerHTML = '';
            cameraResultsSection.style.display = 'block';
            cameraResultsSection.innerHTML = loadingResultsHTML();
            cameraQaSection.style.display = 'none';
            cameraQaSection.innerHTML = '';
            try {
                const file = new File([cameraImageBlob], 'captured-image.jpg', { type: 'image/jpeg' });
                const data = await analyzeImageAPI(file);
                console.log('Camera analysis response:', data); // Debug log
                cameraResults = data;
                cameraResultsSection.innerHTML = renderResults(data, cameraPreviewImg.src);
                if (data.success) {
                    renderChatSection(cameraQaSection, file, data);
                } else {
                    cameraResultsSection.innerHTML = `<div class='error-message'>${data.error || 'Analysis failed.'}</div>`;
                }
            } catch (error) {
                console.error('Camera analysis error:', error);
                cameraResultsSection.innerHTML = `<div class='error-message'>${error.message}</div>`;
            }
        });
        // Clear previous results and Q&A
        cameraResultsSection.style.display = 'none';
        cameraResultsSection.innerHTML = '';
        cameraQaSection.style.display = 'none';
        cameraQaSection.innerHTML = '';
        // Always stop the camera after capture
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
            video.srcObject = null;
        }
        startCameraBtn.disabled = false;
        stopCameraBtn.disabled = true;
        captureImageBtn.disabled = true;
        showSuccess('Camera stopped after capture');
    }, 'image/jpeg');
    showSuccess('Image captured successfully');
}

// API communication
async function analyzeImage(file) {
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/detect`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data);
            showQASection();
        } else {
            throw new Error(data.error || 'Analysis failed');
        }
        
    } catch (error) {
        console.error('Error analyzing image:', error);
        showError(`Failed to analyze image: ${error.message}`);
        hideLoading();
    }
}

async function askQuestion() {
    const question = questionInput.value.trim();
    if (!question) {
        showError('Please enter a question');
        return;
    }
    
    if (!currentImage) {
        showError('No image available. Please upload or capture an image first.');
        return;
    }
    
    showQALoading();
    
    try {
        // Convert base64 image to blob
        const response = await fetch(currentImage);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('question', question);
        
        const apiResponse = await fetch(`${API_BASE_URL}/qa`, {
            method: 'POST',
            body: formData
        });
        
        if (!apiResponse.ok) {
            throw new Error(`HTTP error! status: ${apiResponse.status}`);
        }
        
        const data = await apiResponse.json();
        
        if (data.success) {
            displayAnswer(data.answer);
        } else {
            throw new Error(data.error || 'Failed to get answer');
        }
        
    } catch (error) {
        console.error('Error asking question:', error);
        showError(`Failed to get answer: ${error.message}`);
    } finally {
        hideQALoading();
    }
}

// UI functions
function showLoading() {
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('resultsContent').style.display = 'none';
    document.getElementById('qaSection').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showQALoading() {
    document.getElementById('qaLoading').style.display = 'block';
    document.getElementById('qaAnswer').style.display = 'none';
}

function hideQALoading() {
    document.getElementById('qaLoading').style.display = 'none';
}

function showQASection() {
    document.getElementById('qaSection').style.display = 'block';
}

function displayResults(data) {
    hideLoading();
    
    // Display images
    document.getElementById('originalImage').src = currentImage;
    document.getElementById('annotatedImage').src = `data:image/jpeg;base64,${data.annotated_image}`;
    
    // Display detected objects
    const objectsList = document.getElementById('objectsList');
    objectsList.innerHTML = '';
    
    if (Object.keys(data.detected_objects).length > 0) {
        Object.entries(data.detected_objects).forEach(([object, count]) => {
            const objectItem = document.createElement('div');
            objectItem.className = 'object-item';
            objectItem.innerHTML = `
                <div class="object-name">${object}</div>
                <div class="object-count">Count: ${count}</div>
            `;
            objectsList.appendChild(objectItem);
        });
    } else {
        objectsList.innerHTML = '<p>No construction objects detected</p>';
    }
    
    // Display cost breakdown
    const costList = document.getElementById('costList');
    costList.innerHTML = '';
    
    if (data.cost_breakdown.length > 0) {
        data.cost_breakdown.forEach(item => {
            const costItem = document.createElement('div');
            costItem.className = 'cost-item';
            costItem.innerHTML = `
                <div class="cost-item-info">
                    <h4>${item.object}</h4>
                    <p>Quantity: ${item.quantity} | Unit Cost: $${item.unit_cost}</p>
                </div>
                <div class="cost-item-price">
                    <div class="price">$${item.total_cost}</div>
                    <a href="${item.supplier}" target="_blank" class="buy-link">Buy Now</a>
                </div>
            `;
            costList.appendChild(costItem);
        });
    } else {
        costList.innerHTML = '<p>No cost information available for detected items</p>';
    }
    
    // Display total cost
    document.getElementById('totalCost').textContent = `$${data.total_cost.toFixed(2)}`;
    
    // Display recommendations
    document.getElementById('recommendationsText').innerHTML = data.recommendations.replace(/\n/g, '<br>');
    
    // Show results
    document.getElementById('resultsContent').style.display = 'block';
}

function displayAnswer(answer) {
    const answerText = document.getElementById('answerText');
    answerText.innerHTML = answer.replace(/\n/g, '<br>');
    document.getElementById('qaAnswer').style.display = 'block';
}

function showSuccess(message) {
    // You can implement a toast notification system here
    console.log('Success:', message);
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorModal').style.display = 'flex';
}

function closeErrorModal() {
    document.getElementById('errorModal').style.display = 'none';
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('errorModal');
    if (event.target === modal) {
        closeErrorModal();
    }
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (stream) {
        stopCamera();
    }
});

// --- API call for analysis ---
async function analyzeImageAPI(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/detect`, {
        method: 'POST',
        body: formData
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

// --- Direct Azure OpenAI Q&A ---
async function askAzureOpenAI(imageBlob, question, detectedItems, costBreakdown, totalCost, isFollowUp = false) {
    try {
        // Convert blob to base64
        const base64Image = await blobToBase64(imageBlob);
        
        // Build objects string
        const objectsStr = detectedItems && Object.keys(detectedItems).length > 0 
            ? Object.entries(detectedItems).map(([k, v]) => `${k} (${v})`).join(", ")
            : "None";

        // Build cost breakdown string
        const costLines = [];
        if (costBreakdown && costBreakdown.length > 0) {
            costBreakdown.forEach(item => {
                costLines.push(`- ${item.object}: ${item.quantity} x $${item.unit_cost} = $${item.total_cost} (Supplier: ${item.supplier})`);
            });
        }
        const costBreakdownStr = costLines.length > 0 ? costLines.join("\n") : "No cost items detected.";

        let systemPrompt, userPrompt;
        if (!isFollowUp) {
            // Full cost estimation system prompt for first message
            systemPrompt = `You are a professional construction cost estimator and consultant. Analyze the image and provide a comprehensive, actionable, and friendly construction analysis.\n\nThe following construction objects were detected in the image:\n${objectsStr}\n\nHere is the cost breakdown for these items:\n${costBreakdownStr}\n\nThe total estimated cost is: $${totalCost || 0}\n\nYour response must always include:\n\n1. **Actionable Recommendations**: Give specific, practical suggestions for improving, upgrading, or fixing the room or construction scenario shown in the image.\n2. **Labor & Materials Analysis**: Use appropriate labor rates for each trade, and search the web for current material prices.\n3. **Summary Table**: Clearly summarize labor, materials, and total costs.\n4. **Supplier Links**: Include direct links to suppliers for each material.\n5. **Conversational Tone**: Be friendly and helpful, but always focused on construction advice.\n6. **Critical Thinking**: Suggest alternatives, upgrades, or cost-saving options.\n\nIMPORTANT: Always reference the user's question, the detected objects, and the image. Never give a generic answer.\n\nFormat your response with clear sections for Recommendations, Labor, Materials, Summary, and Supplier Links.`;
            userPrompt = `User question: ${question}\n\nPlease analyze the image and provide a comprehensive, actionable construction estimate and improvement advice. Include detailed breakdowns for labor, materials, and total costs. Give specific recommendations for this scenario.`;
        } else {
            // Friendly, context-aware prompt for follow-ups
            systemPrompt = `You are a helpful, friendly construction consultant. Respond conversationally, like ChatGPT.\n\nReference the user's new question and the context of the previous analysis, but do NOT repeat the full cost breakdown or details unless the user asks for them again.\n\nIf the user asks for clarification, follow-up, or new advice, answer directly and concisely. If they ask for a new estimate or details, provide them as needed.\n\nKeep your answers focused, friendly, and relevant to the user's latest message.`;
            userPrompt = `User follow-up: ${question}`;
        }

        // Call Azure OpenAI with correct endpoint format
        console.log('Calling Azure OpenAI with endpoint:', `${AZURE_ENDPOINT}openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=2024-12-01-preview`);
        console.log('Request body:', JSON.stringify({
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: [
                        { type: "text", text: userPrompt },
                        { 
                            type: "image_url", 
                            image_url: { 
                                url: `data:image/jpeg;base64,${base64Image.substring(0, 100)}...` // Log first 100 chars
                            } 
                        }
                    ]
                }
            ],
            max_completion_tokens: 8000
        }, null, 2));

        const response = await fetch(`${AZURE_ENDPOINT}openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=2024-12-01-preview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_API_KEY
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: userPrompt },
                            { 
                                type: "image_url", 
                                image_url: { 
                                    url: `data:image/jpeg;base64,${base64Image}`
                                } 
                            }
                        ]
                    }
                ],
                max_completion_tokens: 4000  // Increased for more complete responses
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Azure OpenAI error response:', errorText);
            
            // If it's a CORS error or 400, try using backend as proxy
            if (response.status === 400 || errorText.includes('CORS') || errorText.includes('cors')) {
                console.log('Trying backend proxy as fallback...');
                return await askBackendProxy(imageBlob, question, detectedItems, costBreakdown, totalCost);
            }
            
            throw new Error(`Azure OpenAI error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();

    } catch (error) {
        console.error('Azure OpenAI Q&A error:', error);
        return `❌ Error: Unable to get Azure OpenAI response. ${error.message}`;
    }
}

// Helper function to convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Fallback function to use backend as proxy
async function askBackendProxy(file, question, detectedItems, costBreakdown, totalCost) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('question', question);
        
        const response = await fetch(`${API_BASE_URL}/qa`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Backend proxy error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
            return data.answer;
        } else {
            throw new Error(data.error || 'Backend proxy failed');
        }
    } catch (error) {
        console.error('Backend proxy error:', error);
        return `❌ Error: Backend proxy failed. ${error.message}`;
    }
}

// --- Render Results ---
function renderResults(data, imageUrl) {
    if (!data.success) {
        return `<div class='error-message'>${data.error || 'Analysis failed.'}</div>`;
    }
    // Only show cost estimation for real construction objects
    const validObjects = Object.keys(data.detected_objects).filter(obj => obj.toLowerCase() !== 'person');
    const hasCost = data.cost_breakdown && data.cost_breakdown.length > 0 && validObjects.length > 0;
    // Only show Show Recommendation button if there is a real recommendation or cost
    let showRecommendationBtn = '';
    if ((data.recommendations && data.recommendations.trim().length > 0) || hasCost) {
        showRecommendationBtn = `
            <button class="btn btn-warning show-recommendation-btn" style="margin-bottom: 1rem;">
                <i class="fas fa-lightbulb"></i> Show Recommendation & Cost
            </button>
            <div class="recommendation-modal" style="display:none; margin-bottom: 1rem;">
                <div class="recommendation-content" style="background:#f8f9fa; padding:20px; border-radius:8px; border-left:4px solid #f39c12;">
                    <h4>Recommendation & Cost Estimation</h4>
                    ${hasCost ? `
                    <div class="cost-breakdown">
                        <h3><i class="fas fa-dollar-sign"></i> Cost Estimation</h3>
                        <div class="cost-list">
                            ${data.cost_breakdown.map(item => `
                                <div class="cost-item">
                                    <div class="cost-item-info">
                                        <h4>${item.object}</h4>
                                        <p>Quantity: ${item.quantity} | Unit Cost: $${item.unit_cost}</p>
                                    </div>
                                    <div class="cost-item-price">
                                        <div class="price">$${item.total_cost}</div>
                                        <a href="${item.supplier}" target="_blank" class="buy-link">Buy Now</a>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="total-cost">
                            <h4>Total Estimated Cost</h4>
                            <div class="total-amount">$${data.total_cost.toFixed(2)}</div>
                        </div>
                    </div>
                    ` : '<p>No cost information available for detected items</p>'}
                    ${data.recommendations && data.recommendations.trim().length > 0 ? `<div class="recommendation-text">${data.recommendations.replace(/\n/g, '<br>')}</div>` : ''}
                </div>
            </div>
        `;
    }
    // After rendering, add event listeners for the button/modal
    setTimeout(() => {
        const btn = document.querySelector('.show-recommendation-btn');
        const modal = document.querySelector('.recommendation-modal');
        if (btn && modal) {
            btn.onclick = () => {
                modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
            };
        }
    }, 0);
    return `
        <h2><i class="fas fa-chart-bar"></i> Analysis Results</h2>
        <div class="image-container">
            <h3>Detected Objects</h3>
            <img src="data:image/jpeg;base64,${data.annotated_image}" alt="Detected Objects" style="max-width: 100%; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        </div>
        <div class="detected-objects">
            <h3><i class="fas fa-search"></i> Detected Objects</h3>
            <div class="objects-list">
                ${Object.keys(data.detected_objects).length > 0 ?
                    Object.entries(data.detected_objects).map(([object, count]) => `
                        <div class="object-item">
                            <div class="object-name">${object}</div>
                            <div class="object-count">Count: ${count}</div>
                        </div>
                    `).join('') : '<p>No construction objects detected</p>'}
            </div>
        </div>
        ${showRecommendationBtn}
    `;
}

function loadingResultsHTML() {
    return `<div class="loading-state"><div class="spinner"></div><p>Analyzing image...</p></div>`;
}

// --- Render WhatsApp-style Chatbot Section ---
function renderChatSection(section, file, data) {
    section.innerHTML = `
        <h2 style="color:#075e54;"><i class="fas fa-comments"></i> Construction Chat</h2>
        <div class="chat-window" id="chatWindow" style="max-height: 400px; min-height: 200px; overflow-y: auto; background: #ece5dd; border-radius: 10px; padding: 20px 10px 20px 10px; margin-bottom: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); position: relative;"></div>
        <div class="chat-input-row" style="display: flex; gap: 10px; margin-top: 10px; background: #f7f7f7; border-radius: 10px; padding: 10px 10px;">
            <textarea class="chat-input" id="chatInput" placeholder="Type your message... (press Enter to send, Shift+Enter for new line)" style="flex: 1; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 25px; font-size: 1rem; min-height: 40px; max-height: 300px; resize: none; overflow-y: auto; transition: height 0.2s;"></textarea>
            <button class="btn btn-primary" id="sendChatBtn" style="border-radius: 25px; padding: 0 20px; background: #25d366; border: none;"><i class="fas fa-paper-plane"></i> Send</button>
        </div>
        <div id="chatQrSection" style="display:none; margin-top: 10px; text-align:center;"></div>
    `;
    // Add hardcoded debug QR code for DOM/CSS testing
    const qrSection = section.querySelector('#chatQrSection');
    if (qrSection) {
      qrSection.innerHTML = `
        <div style='display:inline-block; background:#e3fdf0; border:2px solid #2196f3; border-radius:12px; padding:12px 18px;'>
          <h4 style='color:#1976d2; margin-bottom:8px;'><i class='fas fa-qrcode'></i> Debug QR</h4>
          <img src='https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DebugQRCodeTest' alt='QR Code' style='max-width:160px; border-radius:8px; border:1.5px solid #2196f3; box-shadow:0 2px 8px #2196f355;'>
          <div style='font-size:0.9em; color:#555; margin-top:8px;'>This QR code is always visible for debugging</div>
        </div>
      `;
      qrSection.style.display = 'block';
    }
    section.style.display = 'block';
    const chatWindow = section.querySelector('#chatWindow');
    const chatInput = section.querySelector('#chatInput');
    const sendBtn = section.querySelector('#sendChatBtn');
    let chatHistory = [];
    let isFirstUserMessage = true;

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function appendMessage(sender, text, isLoading = false, timestamp = null) {
        if (isLoading && sender === 'ai') {
            // Show a chat bubble with animated three dots (bouncing)
            const bubbleRow = document.createElement('div');
            bubbleRow.className = 'ai-loading-row';
            bubbleRow.style.display = 'flex';
            bubbleRow.style.alignItems = 'flex-end';
            bubbleRow.style.margin = '10px 0';
            bubbleRow.style.justifyContent = 'flex-start';
            // Avatar
            const avatar = document.createElement('div');
            avatar.style.width = '36px';
            avatar.style.height = '36px';
            avatar.style.borderRadius = '50%';
            avatar.style.background = '#075e54';
            avatar.style.display = 'flex';
            avatar.style.alignItems = 'center';
            avatar.style.justifyContent = 'center';
            avatar.style.margin = '0 10px 0 0';
            avatar.innerHTML = '<i class="fas fa-robot" style="color:white;font-size:1.2rem;"></i>';
            // Bubble with animated dots
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble ai-bubble';
            bubble.style.padding = '12px 18px';
            bubble.style.borderRadius = '18px 18px 18px 4px';
            bubble.style.maxWidth = '70%';
            bubble.style.background = '#fff';
            bubble.style.color = '#232b3b';
            bubble.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
            bubble.style.position = 'relative';
            bubble.innerHTML = `<span class="chat-typing-dots"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span>`;
            // Add CSS for animation if not already present
            if (!document.getElementById('chat-typing-dots-style')) {
                const style = document.createElement('style');
                style.id = 'chat-typing-dots-style';
                style.innerHTML = `
                .chat-typing-dots {
                    display: inline-flex;
                    align-items: flex-end;
                    height: 18px;
                    gap: 3px;
                }
                .chat-typing-dots .dot {
                    width: 7px;
                    height: 7px;
                    background: #3498db;
                    border-radius: 50%;
                    margin: 0 2px;
                    display: inline-block;
                    animation: chat-bounce 1.2s infinite both;
                } 
                .chat-typing-dots .dot:nth-child(1) { animation-delay: 0s; }
                .chat-typing-dots .dot:nth-child(2) { animation-delay: 0.2s; }
                .chat-typing-dots .dot:nth-child(3) { animation-delay: 0.4s; }
                @keyframes chat-bounce {
                    0%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-8px); }
                }
                `;
                document.head.appendChild(style);
            }
            // Timestamp (optional, can be omitted for loading)
            // Layout
            bubbleRow.appendChild(avatar);
            bubbleRow.appendChild(bubble);
            chatWindow.appendChild(bubbleRow);
            chatWindow.scrollTop = chatWindow.scrollHeight;
            return;
        }
        const bubbleRow = document.createElement('div');
        bubbleRow.style.display = 'flex';
        bubbleRow.style.alignItems = 'flex-end';
        bubbleRow.style.margin = '10px 0';
        bubbleRow.style.justifyContent = sender === 'user' ? 'flex-end' : 'flex-start';
        // Avatar
        const avatar = document.createElement('div');
        avatar.style.width = '36px';
        avatar.style.height = '36px';
        avatar.style.borderRadius = '50%';
        avatar.style.background = sender === 'user' ? '#25d366' : '#075e54';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.margin = sender === 'user' ? '0 0 0 10px' : '0 10px 0 0';
        avatar.innerHTML = sender === 'user'
            ? '<i class="fas fa-user" style="color:white;font-size:1.2rem;"></i>'
            : '<i class="fas fa-robot" style="color:white;font-size:1.2rem;"></i>';
        // Bubble
        const bubble = document.createElement('div');
        bubble.className = sender === 'user' ? 'chat-bubble user-bubble' : 'chat-bubble ai-bubble';
        bubble.style.padding = '12px 18px';
        bubble.style.borderRadius = sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px';
        bubble.style.maxWidth = '70%';
        bubble.style.background = sender === 'user' ? '#25d366' : '#fff';
        bubble.style.color = sender === 'user' ? 'white' : '#232b3b';
        bubble.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)';
        bubble.style.position = 'relative';
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        // Timestamp
        const time = document.createElement('div');
        time.style.fontSize = '0.8rem';
        time.style.color = '#888';
        time.style.marginTop = '6px';
        time.style.textAlign = sender === 'user' ? 'right' : 'left';
        time.textContent = timestamp || formatTime(new Date());
        bubble.appendChild(time);
        // Layout
        if (sender === 'user') {
            bubbleRow.appendChild(bubble);
            bubbleRow.appendChild(avatar);
        } else {
            bubbleRow.appendChild(avatar);
            bubbleRow.appendChild(bubble);
        }
        chatWindow.appendChild(bubbleRow);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function showChatQrCode(answer) {
        const qrSection = section.querySelector('#chatQrSection');
        if (answer && answer.trim().length > 0) {
            // Clean the answer: remove HTML tags and line breaks
            let cleanAnswer = answer.replace(/<[^>]*>/g, ''); // Remove HTML tags
            cleanAnswer = cleanAnswer.replace(/\n/g, ' '); // Remove line breaks
            cleanAnswer = cleanAnswer.replace(/\s+/g, ' ').trim(); // Collapse whitespace
            // Truncate to 300 characters for QR code
            let truncated = cleanAnswer.slice(0, 300);
            // Remove all non-ASCII characters (including emojis and special symbols)
            let asciiOnly = truncated.replace(/[^\x20-\x7E]/g, '');
            let warning = '';
            if (cleanAnswer.length > 300) {
                warning = `<div style='color:#e67e22; font-size:0.95em; margin-top:6px;'>QR code shows only the first 300 ASCII characters of the answer.</div>`;
            }
            // Generate QR code from the ascii-only truncated answer using an online API
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(asciiOnly)}`;
            qrSection.innerHTML = `
                <div style='display:inline-block; background:#e3fdf0; border:2px solid #2196f3; border-radius:12px; padding:12px 18px;'>
                  <h4 style='color:#1976d2; margin-bottom:8px;'><i class='fas fa-qrcode'></i> Answer QR</h4>
                  <img src='${qrUrl}' alt='QR Code' style='max-width:160px; border-radius:8px; border:1.5px solid #2196f3; box-shadow:0 2px 8px #2196f355;'>
                  <div style='font-size:0.9em; color:#555; margin-top:8px;'>QR code for the latest answer</div>
                  ${warning}
                </div>
            `;
            qrSection.style.display = 'block';
        } else {
            qrSection.innerHTML = '';
            qrSection.style.display = 'none';
        }
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        appendMessage('user', message, false);
        chatHistory.push({ role: 'user', content: message, timestamp: formatTime(new Date()) });
        chatInput.value = '';
        // Reset height to default when sending
        chatInput.style.height = '40px';
        appendMessage('ai', '', true); // Show spinner only
        try {
            let answer;
            if (isFirstUserMessage) {
                answer = await askAzureOpenAI(
                    file, 
                    message, 
                    data.detected_objects, 
                    data.cost_breakdown, 
                    data.total_cost
                );
                isFirstUserMessage = false;
            } else {
                answer = await askAzureOpenAI(
                    file, 
                    message, 
                    data.detected_objects, 
                    data.cost_breakdown, 
                    data.total_cost,
                    true
                );
            }
            // Remove loading spinner
            const loadingBubbles = chatWindow.querySelectorAll('.ai-loading-row');
            loadingBubbles.forEach(b => b.remove());
            appendMessage('ai', answer, false);
            showChatQrCode(answer); // <-- Now only shows after answer
        } catch (error) {
            const loadingBubbles = chatWindow.querySelectorAll('.ai-loading-row');
            loadingBubbles.forEach(b => b.remove());
            appendMessage('ai', 'Sorry, there was an error getting a response.', false);
            showChatQrCode('');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });
    chatInput.focus();
    // Add autosize logic for textarea
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 300) + 'px';
        });
        // Initialize height on mount
        setTimeout(() => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 300) + 'px';
        }, 0);
    }
}

// --- Commented out old chat code ---
// function renderChatSection(section, file, data) {
//     section.innerHTML = `
//         <h2><i class="fas fa-comments"></i> Interactive Chat</h2>
//         <div class="chat-window" id="chatWindow" style="max-height: 350px; overflow-y: auto; background: #232b3b; border-radius: 10px; padding: 20px; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
//         </div>
//         <div class="chat-input-row" style="display: flex; gap: 10px;">
//             <input type="text" class="chat-input" id="chatInput" placeholder="Type your message..." style="flex: 1; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 25px; font-size: 1rem;">
//             <button class="btn btn-primary" id="sendChatBtn" style="border-radius: 25px; padding: 0 20px;"><i class="fas fa-paper-plane"></i> Send</button>
//         </div>
//     `;
//     section.style.display = 'block';
//     const chatWindow = section.querySelector('#chatWindow');
//     const chatInput = section.querySelector('#chatInput');
//     const sendBtn = section.querySelector('#sendChatBtn');
//     let chatHistory = [];

//     function appendMessage(sender, text, isLoading = false) {
//         const bubble = document.createElement('div');
//         bubble.className = sender === 'user' ? 'chat-bubble user-bubble' : 'chat-bubble ai-bubble';
//         bubble.style.margin = '10px 0';
//         bubble.style.padding = '12px 18px';
//         bubble.style.borderRadius = '18px';
//         bubble.style.maxWidth = '80%';
//         bubble.style.background = sender === 'user' ? '#3498db' : '#f8f9fa';
//         bubble.style.color = sender === 'user' ? 'white' : '#232b3b';
//         bubble.style.alignSelf = sender === 'user' ? 'flex-end' : 'flex-start';
//         bubble.innerHTML = isLoading ? `<span class="spinner" style="margin-right:8px;"></span> <span>AI is typing...</span>` : text.replace(/\n/g, '<br>');
//         chatWindow.appendChild(bubble);
//         chatWindow.scrollTop = chatWindow.scrollHeight;
//     }

//     async function sendMessage() {
//         const message = chatInput.value.trim();
//         if (!message) return;
//         appendMessage('user', message);
//         chatHistory.push({ role: 'user', content: message });
//         chatInput.value = '';
//         appendMessage('ai', '', true); // Loading bubble
//         try {
//             // Use direct Azure OpenAI call instead of backend
//             const answer = await askAzureOpenAI(
//                 file, 
//                 message, 
//                 data.detected_objects, 
//                 data.cost_breakdown, 
//                 data.total_cost
//             );
//             // Remove loading bubble
//             const bubbles = chatWindow.querySelectorAll('.ai-bubble');
//             if (bubbles.length > 0 && bubbles[bubbles.length - 1].innerHTML.includes('AI is typing')) {
//                 chatWindow.removeChild(bubbles[bubbles.length - 1]);
//             }
//             appendMessage('ai', answer);
//             chatHistory.push({ role: 'ai', content: answer });
//         } catch (error) {
//             const bubbles = chatWindow.querySelectorAll('.ai-bubble');
//             if (bubbles.length > 0 && bubbles[bubbles.length - 1].innerHTML.includes('AI is typing')) {
//                 chatWindow.removeChild(bubbles[bubbles.length - 1]);
//             }
//             appendMessage('ai', `<span style='color:#e74c3c'>${error.message}</span>`);
//         }
//     }

//     sendBtn.addEventListener('click', sendMessage);
//     chatInput.addEventListener('keypress', function(event) {
//         if (event.key === 'Enter') {
//             event.preventDefault();
//             sendMessage();
//         }
//     });
//     chatInput.focus();
// } 