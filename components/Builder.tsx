import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, collection } from 'firebase/firestore';
import { SiteData, SitePrompt, AppUser } from '../types';
import { generateLandingPage } from '../services/geminiService';
import { Icons } from './Icons';

interface BuilderProps {
  user: AppUser;
  siteId?: string; // If editing existing
  onBack: () => void;
}

const DEFAULT_PROMPT: SitePrompt = {
  title: '',
  businessType: '',
  targetAudience: '',
  colorTheme: 'Modern Blue and White',
  features: 'Hero Section, Services List, Testimonials, Pricing, Contact Form',
  ctaText: 'Get Started Now'
};

export const Builder: React.FC<BuilderProps> = ({ user, siteId, onBack }) => {
  const [step, setStep] = useState<'prompt' | 'editor'>('prompt');
  const [promptData, setPromptData] = useState<SitePrompt>(DEFAULT_PROMPT);
  const [htmlContent, setHtmlContent] = useState('');
  const [meta, setMeta] = useState({ seoTitle: '', seoDescription: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(siteId || null);
  const [isPublished, setIsPublished] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');

  useEffect(() => {
    if (siteId) {
      loadSite(siteId);
    }
  }, [siteId]);

  const loadSite = async (id: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, "users", user.uid, "sites", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as SiteData;
        setPromptData(data.prompt);
        setHtmlContent(data.html);
        setMeta(data.meta);
        setIsPublished(data.status === 'published');
        setStep('editor');
        setCurrentSiteId(id);
      }
    } catch (err) {
      console.error("Failed to load site", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!promptData.title || !promptData.businessType) return;
    
    setLoading(true);
    try {
      const result = await generateLandingPage(promptData);
      setHtmlContent(result.html);
      setMeta({ seoTitle: result.seoTitle, seoDescription: result.seoDescription });
      setStep('editor');
    } catch (err) {
      alert("Failed to generate site. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    setSaving(true);
    try {
      let idToUse = currentSiteId;
      if (!idToUse) {
        // Create a new reference to generate an ID
        const newRef = doc(collection(db, "users", user.uid, "sites"));
        idToUse = newRef.id;
      }
      
      const siteData: Partial<SiteData> = {
        siteId: idToUse,
        ownerUid: user.uid,
        title: promptData.title,
        prompt: promptData,
        html: htmlContent,
        meta: meta,
        status: publish ? 'published' : (isPublished ? 'published' : 'draft'),
        updatedAt: serverTimestamp() as any,
      };

      if (!currentSiteId) {
        siteData.createdAt = serverTimestamp() as any;
      }

      // Save to user's collection
      await setDoc(doc(db, "users", user.uid, "sites", idToUse), siteData, { merge: true });
      
      if (publish) {
        // Publish to public collection
        await setDoc(doc(db, "publicSites", idToUse), {
            siteId: idToUse,
            ownerUid: user.uid,
            title: promptData.title,
            html: htmlContent,
            meta: meta,
            status: 'published',
            publishedAt: serverTimestamp()
        });
        setIsPublished(true);
      } else if (isPublished && !publish) {
         // If simply saving a draft of an already published site, we don't necessarily unpublish,
         // but if we wanted to sync updates to public, we would do it here.
         // For now, let's keep "Publish" as the mechanism to push changes to public.
      }

      setCurrentSiteId(idToUse);
      // Optional toast success
    } catch (err) {
      console.error("Error saving", err);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!currentSiteId) return;
    setSaving(true);
    try {
        await deleteDoc(doc(db, "publicSites", currentSiteId));
        await setDoc(doc(db, "users", user.uid, "sites", currentSiteId), {
            status: 'draft',
            updatedAt: serverTimestamp()
        }, { merge: true });
        setIsPublished(false);
    } catch (e) {
        console.error(e);
        alert("Failed to unpublish");
    } finally {
        setSaving(false);
    }
  };

  if (loading && step === 'prompt' && !htmlContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Icons.Loader className="w-12 h-12 animate-spin text-brand-600 mb-4" />
        <p className="text-gray-500 text-lg animate-pulse">Consulting the AI architects...</p>
      </div>
    );
  }

  // Step 1: Prompt Form
  if (step === 'prompt') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button onClick={onBack} className="mb-6 flex items-center text-gray-500 hover:text-gray-900">
          <Icons.Back className="w-4 h-4 mr-1" /> Back to Dashboard
        </button>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Icons.Sparkles className="text-brand-500" />
              Describe your dream landing page
            </h2>
            <p className="text-gray-500 mt-2">Our AI will generate a complete, responsive design based on your inputs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
              <input 
                type="text" 
                value={promptData.title}
                onChange={e => setPromptData({...promptData, title: e.target.value})}
                placeholder="e.g., Summit Coffee Roasters"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <input 
                type="text" 
                value={promptData.businessType}
                onChange={e => setPromptData({...promptData, businessType: e.target.value})}
                placeholder="e.g., Coffee Shop, SaaS, Portfolio"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <input 
                type="text" 
                value={promptData.targetAudience}
                onChange={e => setPromptData({...promptData, targetAudience: e.target.value})}
                placeholder="e.g., Remote workers, Coffee enthusiasts"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Desired Sections</label>
              <textarea 
                value={promptData.features}
                onChange={e => setPromptData({...promptData, features: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none h-24"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Color Theme</label>
               <input 
                type="text" 
                value={promptData.colorTheme}
                onChange={e => setPromptData({...promptData, colorTheme: e.target.value})}
                placeholder="e.g., Dark mode with neon green"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="col-span-2 md:col-span-1">
               <label className="block text-sm font-medium text-gray-700 mb-1">Main CTA Text</label>
               <input 
                type="text" 
                value={promptData.ctaText}
                onChange={e => setPromptData({...promptData, ctaText: e.target.value})}
                placeholder="e.g., Sign Up Free"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={!promptData.title || !promptData.businessType}
              className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icons.Sparkles className="w-5 h-5" /> Generate Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Editor (Preview & Code)
  const publicUrl = isPublished && currentSiteId ? `${window.location.origin}/#/s/${currentSiteId}` : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Toolbar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-900">
            <Icons.Back className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-lg truncate max-w-xs">{promptData.title}</h1>
          <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
            <button 
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition ${activeTab === 'preview' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
                Preview
            </button>
            <button 
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-md transition ${activeTab === 'code' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
            >
                Edit Code
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
            {isPublished && publicUrl && (
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex items-center gap-1 text-sm mr-2">
                    <Icons.External className="w-4 h-4" /> View Live
                </a>
            )}
            
            <button 
                onClick={() => handleSave(false)}
                disabled={saving}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium"
            >
                Save Draft
            </button>

            {isPublished ? (
                <button
                    onClick={handleUnpublish}
                    disabled={saving}
                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                    {saving ? <Icons.Loader className="animate-spin w-4 h-4"/> : 'Unpublish'}
                </button>
            ) : (
                <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="bg-brand-600 text-white hover:bg-brand-700 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                    {saving ? <Icons.Loader className="animate-spin w-4 h-4"/> : 'Publish'}
                </button>
            )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'preview' ? (
            <iframe 
                srcDoc={htmlContent}
                title="Preview"
                className="w-full h-full bg-white"
                sandbox="allow-scripts" // Tailwind CDN needs scripts
            />
        ) : (
            <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full h-full bg-gray-900 text-green-400 font-mono text-sm p-6 outline-none resize-none"
                spellCheck={false}
            />
        )}
      </div>
    </div>
  );
};
