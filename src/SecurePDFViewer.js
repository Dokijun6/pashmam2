import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Lock, User, KeyRound, Eye, EyeOff } from 'lucide-react';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function SecurePDFApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Mock credentials - replace with your actual authentication system
  const validUsername = 'demo';
  const validPassword = 'password123';
  
  const handleLogin = (e) => {
    e.preventDefault();
    if (username === validUsername && password === validPassword) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid username or password');
    }
  };

  return (
    <div className="w-full h-screen bg-gray-100">
      {!isLoggedIn ? (
        <LoginScreen 
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          loginError={loginError}
          handleLogin={handleLogin}
        />
      ) : (
        <SecurePDFViewer />
      )}
    </div>
  );
}

// Login Component
// Add this to your login component
useEffect(() => {
  // Simple device fingerprinting
  const generateDeviceFingerprint = () => {
    const screen = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    
    // Create a simple hash from the device information
    return btoa(`${screen}-${timezone}-${language}-${platform}-${userAgent.substring(0, 50)}`);
  };
  
  // Store the fingerprint in localStorage when user logs in
  const storeDeviceFingerprint = () => {
    const fingerprint = generateDeviceFingerprint();
    localStorage.setItem('device_fingerprint', fingerprint);
    
    // You'd also want to send this to your backend to store with the user account
  };
  
  // Check if this is a new device
  const checkDeviceFingerprint = () => {
    const storedFingerprint = localStorage.getItem('device_fingerprint');
    const currentFingerprint = generateDeviceFingerprint();
    
    return storedFingerprint === currentFingerprint;
  };
}, []);
function LoginScreen({ username, setUsername, password, setPassword, showPassword, setShowPassword, loginError, handleLogin }) {
  return (
    <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-center mb-6">
          <Lock className="text-blue-600" size={32} />
          <h1 className="ml-2 text-2xl font-bold text-gray-800">Secure PDF Viewer</h1>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="text-gray-400" size={18} />
              </div>
              <input
                id="username"
                type="text"
                className="w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <KeyRound className="text-gray-400" size={18} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full py-2 pl-10 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="text-gray-400" size={18} />
                ) : (
                  <Eye className="text-gray-400" size={18} />
                )}
              </button>
            </div>
          </div>
          
          {loginError && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
              {loginError}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

// PDF Viewer Component
function SecurePDFViewer() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [securityActive] = useState(true);
  const [screenCaptureAttempted, setScreenCaptureAttempted] = useState(false);
  
  const containerRef = useRef(null);
  const screenshotOverlayRef = useRef(null);
  
  // Your pre-uploaded PDF path
  const pdfFile = "/document.pdf"; // Replace with your actual PDF path
  
  // Function to handle document loading success
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  
  // Enhanced security for screenshots - Similar to Telegram's approach
  useEffect(() => {
    // Anti-Screenshot Layer
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '999999';
    overlay.style.pointerEvents = 'none';
    overlay.style.display = 'none';
    overlay.style.backgroundColor = '#000';
    screenshotOverlayRef.current = overlay;
    document.body.appendChild(overlay);

    // iOS screenshot detection (using visibilitychange as proxy)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User might be taking a screenshot, show overlay briefly
        overlay.style.display = 'block';
        setTimeout(() => {
          if (document.visibilityState === 'visible') {
            overlay.style.display = 'none';
            setScreenCaptureAttempted(true);
            setTimeout(() => setScreenCaptureAttempted(false), 3000);
          }
        }, 300);
      }
    };
    
    // Android screenshot detection (using media projection APIs indirectly)
    const handleScreenChange = () => {
      if (window.matchMedia('(display-mode: minimal-ui)').matches ||
          window.matchMedia('(display-mode: fullscreen)').matches) {
        // Potential screenshot UI - activate overlay
        overlay.style.display = 'block';
        setTimeout(() => {
          overlay.style.display = 'none';
          setScreenCaptureAttempted(true);
          setTimeout(() => setScreenCaptureAttempted(false), 3000);
        }, 300);
      }
    };
    
    // Prevent right-click context menu
    const preventRightClick = (e) => e.preventDefault();
    
    // Prevent keyboard shortcuts for screenshots, printing, saving
    const preventKeyboardShortcuts = (e) => {
      // Print and Save prevention
      if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
        setScreenCaptureAttempted(true);
        setTimeout(() => setScreenCaptureAttempted(false), 3000);
      }
      
      // Clipboard operations prevention
      if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'x')) {
        e.preventDefault();
      }
      
      // Screenshot shortcuts prevention
      // Windows: Win+PrintScreen, PrintScreen
      // Mac: Cmd+Shift+3, Cmd+Shift+4
      if (e.key === 'PrintScreen' || 
          ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === '3' || e.key === '4'))) {
        e.preventDefault();
        overlay.style.display = 'block';
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 300);
        setScreenCaptureAttempted(true);
        setTimeout(() => setScreenCaptureAttempted(false), 3000);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.matchMedia('(display-mode)').addEventListener('change', handleScreenChange);
    document.addEventListener('contextmenu', preventRightClick);
    document.addEventListener('keydown', preventKeyboardShortcuts);
    
    // Apply CSS to prevent selection and disable all saving options
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      
      /* Apply backdrop-filter to make screenshots less useful */
      .pdf-secure-container * {
        backdrop-filter: brightness(1.05) contrast(0.92) saturate(0.7);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.matchMedia('(display-mode)').removeEventListener('change', handleScreenChange);
      document.removeEventListener('contextmenu', preventRightClick);
      document.removeEventListener('keydown', preventKeyboardShortcuts);
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    };
  }, []);
  
  // Functions to navigate between pages
  const goToPrevPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };
  
  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));
  };
  
  // Handle zoom in/out
  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.2, 3));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.2, 0.6));
  
  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  // Mobile touch events for page turning
  const [touchStart, setTouchStart] = useState(null);
  
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    // Swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left, go to next page
        goToNextPage();
      } else {
        // Swipe right, go to previous page
        goToPrevPage();
      }
    }
    
    setTouchStart(null);
  };
  
  // Detect orientation changes for mobile devices
  useEffect(() => {
    const handleOrientationChange = () => {
      // Adjust the view when orientation changes
      setScale(window.innerWidth > window.innerHeight ? 1.2 : 1);
    };
    
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);
  
  return (
    <div className="flex flex-col items-center w-full h-screen bg-gray-100 touch-none select-none" ref={containerRef}>
      {/* Header with controls */}
      <div className="w-full p-4 bg-white shadow-md flex items-center justify-between">
        <div className="flex items-center">
          <Lock className={`mr-2 ${securityActive ? 'text-green-600' : 'text-gray-400'}`} size={20} />
          <span className="text-sm font-medium">Secure PDF Viewer</span>
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={zoomOut}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <span className="text-xl font-bold">-</span>
          </button>
          <span className="mx-2 text-sm">{Math.round(scale * 100)}%</span>
          <button 
            onClick={zoomIn}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <span className="text-xl font-bold">+</span>
          </button>
          <button 
            onClick={toggleFullscreen}
            className="ml-2 p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>
      
      {/* Screenshot warning notification */}
      {screenCaptureAttempted && (
        <div className="absolute top-16 left-0 right-0 mx-auto w-5/6 p-3 bg-red-500 text-white rounded-md shadow-lg z-50 flex items-center justify-center">
          <span className="text-sm font-medium">Screenshot attempt detected! Content is protected.</span>
        </div>
      )}
      
      {/* PDF Document */}
      <div 
        className="flex-grow w-full overflow-auto relative pdf-secure-container"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex justify-center"
          loading={<div className="w-full h-64 flex items-center justify-center">Loading PDF...</div>}
          error={<div className="w-full h-64 flex items-center justify-center text-red-500">Failed to load PDF</div>}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            className="shadow-lg"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
      </div>
      
      {/* Footer with navigation */}
      <div className="w-full p-4 bg-white shadow-md flex items-center justify-between">
        <button 
          onClick={goToPrevPage}
          disabled={pageNumber <= 1}
          className={`p-2 rounded-full ${pageNumber <= 1 ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-100'}`}
        >
          <ChevronLeft size={24} />
        </button>
        
        <p className="text-sm">
          Page <span className="font-medium">{pageNumber}</span> of{" "}
          <span className="font-medium">{numPages}</span>
        </p>
        
        <button 
          onClick={goToNextPage}
          disabled={pageNumber >= numPages}
          className={`p-2 rounded-full ${pageNumber >= numPages ? 'text-gray-300' : 'text-blue-600 hover:bg-blue-100'}`}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}