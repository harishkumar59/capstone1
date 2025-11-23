import { useState } from 'react';
import './VideoGenerator.css';

function VideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');

  // API Configuration - Replace with your actual API endpoint
  const API_ENDPOINT = 'https://api.veo3freeai.com/v1/generate'; // Example endpoint
  // Alternative endpoints you can try:
  // - https://api.vidful.ai/v1/generate
  // - https://api.sisif.ai/v1/generate

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a video prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setVideoUrl(null);

    try {
      // Option 1: If API requires authentication
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          prompt: prompt,
          duration: 10, // seconds
          resolution: '720p'
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle different API response formats
      if (data.video_url) {
        setVideoUrl(data.video_url);
      } else if (data.url) {
        setVideoUrl(data.url);
      } else if (data.result?.video_url) {
        setVideoUrl(data.result.video_url);
      } else {
        // For APIs that return a job ID, you might need to poll
        if (data.job_id || data.id) {
          pollForVideo(data.job_id || data.id);
        } else {
          throw new Error('Unexpected API response format');
        }
      }
    } catch (err) {
      // For demo purposes, show a placeholder if API is not configured
      if (err.message.includes('Failed to fetch') || err.message.includes('CORS')) {
        setError('API not configured. Please add your API key and endpoint. For now, showing demo mode.');
        // Demo mode - show placeholder
        setTimeout(() => {
          setVideoUrl('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
          setLoading(false);
        }, 2000);
      } else {
        setError(err.message || 'Failed to generate video. Please check your API configuration.');
        setLoading(false);
      }
    }
  };

  const pollForVideo = async (jobId) => {
    // Poll the API to check video generation status
    const maxAttempts = 30;
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(`${API_ENDPOINT}/status/${jobId}`, {
          headers: {
            ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
          }
        });

        const data = await response.json();
        
        if (data.status === 'completed' && data.video_url) {
          setVideoUrl(data.video_url);
          setLoading(false);
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          throw new Error('Video generation failed');
        } else if (attempts >= maxAttempts) {
          throw new Error('Video generation timeout');
        }
      } catch (err) {
        clearInterval(pollInterval);
        setError(err.message);
        setLoading(false);
      }
    }, 2000); // Poll every 2 seconds
  };

  return (
    <div className="video-generator">
      <div className="container">
        <h1>AI Video Generator</h1>
        <p className="subtitle">Generate videos from text prompts using AI</p>

        <div className="api-key-section">
          <label htmlFor="apiKey">API Key (Optional - for real API):</label>
          <input
            id="apiKey"
            type="password"
            placeholder="Enter your API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="api-key-input"
          />
          <small>Get a free API key from: Veo3FreeAI, Vidful, or Sisif AI</small>
        </div>

        <div className="input-section">
          <label htmlFor="prompt">Describe the video you want to generate:</label>
          <textarea
            id="prompt"
            placeholder="e.g., A serene beach at sunset with waves gently crashing on the shore..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows="4"
            className="prompt-input"
          />
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={loading || !prompt.trim()}
          className="generate-btn"
        >
          {loading ? 'Generating Video...' : 'Generate Video'}
        </button>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Creating your video... This may take a few moments.</p>
          </div>
        )}

        {videoUrl && !loading && (
          <div className="video-result">
            <h2>Generated Video</h2>
            <video 
              controls 
              className="generated-video"
              src={videoUrl}
            >
              Your browser does not support the video tag.
            </video>
            <div className="video-actions">
              <a 
                href={videoUrl} 
                download 
                className="download-btn"
              >
                Download Video
              </a>
            </div>
          </div>
        )}

        <div className="info-section">
          <h3>How to use:</h3>
          <ol>
            <li>Get a free API key from one of these services:
              <ul>
                <li><a href="https://veo3freeai.com" target="_blank" rel="noopener noreferrer">Veo3FreeAI</a></li>
                <li><a href="https://vidful.ai" target="_blank" rel="noopener noreferrer">Vidful</a></li>
                <li><a href="https://sisif.ai" target="_blank" rel="noopener noreferrer">Sisif AI</a></li>
              </ul>
            </li>
            <li>Enter your API key (optional for demo mode)</li>
            <li>Describe the video you want to generate</li>
            <li>Click "Generate Video" and wait for your AI-generated video!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default VideoGenerator;

