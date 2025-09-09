import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import SlideshowViewer from './components/SlideshowViewer';
import TermsAndConditions from './components/TermsAndConditions';
import PrivacyPolicy from './components/PrivacyPolicy';
import ReleaseNotes from './components/ReleaseNotes';
import { type TempSlideshowData, type Slideshow } from './lib/supabase';
import './index.css';

// Check if we're viewing a specific slideshow
const urlParams = new URLSearchParams(window.location.search);
const viewSlideshowId = urlParams.get('view');
const tempSlideshowData = urlParams.get('temp');
const resetType = urlParams.get('type');
const sessionParam = urlParams.get('session');
const currentPath = window.location.pathname;

if (currentPath === '/terms') {
  // Render the Terms and Conditions page
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <TermsAndConditions />
    </StrictMode>
  );
} else if (currentPath === '/privacy') {
  // Render the Privacy Policy page
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <PrivacyPolicy />
    </StrictMode>
  );
} else if (currentPath === '/release-notes') {
  // Render the Release Notes page
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ReleaseNotes />
    </StrictMode>
  );
} else if (currentPath === '/contact') {
  // Render the Contact page
  import('./components/Contact').then(({ default: Contact }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <Contact />
      </StrictMode>
    );
  });
} else if (currentPath === '/upload' || sessionParam) {
  // Render the Collaborative Upload page
  // Check for either /upload path or session parameter (for Render deployment)
  import('./components/CollaborativeUploadPage').then(({ default: CollaborativeUploadPage }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <CollaborativeUploadPage />
      </StrictMode>
    );
  });
} else if (currentPath === '/uitest') {
  // Render the UITest page (not linked from main app)
  import('./components/UITest').then(({ default: UITest }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <UITest />
      </StrictMode>
    );
  });
} else if (resetType === 'recovery') {
  // Render the password reset form
  import('./components/PasswordResetForm').then(({ default: PasswordResetForm }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <PasswordResetForm />
      </StrictMode>
    );
  });
} else if (viewSlideshowId) {
  // Render the slideshow viewer for saved slideshows
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <SlideshowViewer slideshowId={viewSlideshowId} />
    </StrictMode>
  );
} else if (tempSlideshowData) {
  // Render the slideshow viewer for temporary slideshows
  try {
    const decodedData = atob(tempSlideshowData);
    const tempSlideshow: TempSlideshowData = JSON.parse(decodedData);
    
    // Map TempSlideshowData to Slideshow format
    const slideshow: Partial<Slideshow> = {
      id: 'temp-slideshow',
      name: tempSlideshow.name,
      message: tempSlideshow.message,
      slide_urls: tempSlideshow.slides,
      audio_url: tempSlideshow.audio,
      slide_duration: tempSlideshow.duration,
      transition_type: tempSlideshow.transition,
      user_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <SlideshowViewer slideshowId="temp" initialSlideshow={slideshow} />
      </StrictMode>
    );
  } catch (error) {
    console.error('Error parsing temporary slideshow data:', error);
    // Fallback to main app if parsing fails
    import('./App').then(({ default: App }) => {
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>
      );
    });
  }
} else {
  // Render the main app
  import('./App').then(({ default: App }) => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
}
