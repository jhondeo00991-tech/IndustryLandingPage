import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PublicSiteData } from '../types';
import { Icons } from './Icons';

export const PublicView: React.FC = () => {
  const { siteId } = useParams<{ siteId: string }>();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPublicSite = async () => {
      if (!siteId) return;
      try {
        const docRef = doc(db, 'publicSites', siteId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data() as PublicSiteData;
          setHtml(data.html);
          document.title = data.meta.seoTitle || data.title;
          
          // Inject SEO meta description dynamically
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', data.meta.seoDescription);

        } else {
          setError('Site not found or not published.');
        }
      } catch (err) {
        console.error(err);
        setError('Error loading site.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicSite();
  }, [siteId]);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-white">
        <Icons.Loader className="w-10 h-10 text-brand-600 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600">{error}</p>
        <a href="/" className="mt-8 text-brand-600 hover:underline">Go Home</a>
    </div>
  );

  return (
    <iframe 
        srcDoc={html}
        title="Site"
        className="w-full h-screen border-none"
        style={{ display: 'block' }}
        sandbox="allow-scripts allow-popups allow-forms allow-same-origin"
    />
  );
};
