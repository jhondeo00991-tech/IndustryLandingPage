import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import firebase from 'firebase/compat/app';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { AppUser } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Builder } from './components/Builder';
import { PublicView } from './components/PublicView';
import { Icons } from './components/Icons';

const App: React.FC = () => {
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [builderMode, setBuilderMode] = useState<{ active: boolean; siteId?: string }>({ active: false });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          
          // Optimistically update lastSeen if document exists
          if (userSnap.exists()) {
             await updateDoc(userDocRef, { lastSeen: serverTimestamp() });
             setAppUser(userSnap.data() as AppUser);
          } else {
             // Fallback if signup didn't create doc properly (shouldn't happen with Auth comp logic)
             setAppUser({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: Timestamp.now(),
                lastSeen: Timestamp.now()
             });
          }
        } catch (e) {
          console.error("Error fetching user data", e);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Protected Route Wrapper
  const RequireAuth = ({ children }: { children: React.ReactNode }) => {
    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <Icons.Loader className="w-8 h-8 animate-spin text-gray-400" />
        </div>
    );
    if (!firebaseUser) return <Navigate to="/login" replace />;
    return children;
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
        <Icons.Loader className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/s/:siteId" element={<PublicView />} />
        <Route path="/login" element={!firebaseUser ? <Auth /> : <Navigate to="/" />} />
        
        {/* Dashboard / Builder Logic */}
        <Route path="/" element={
          <RequireAuth>
            <>
              {builderMode.active && appUser ? (
                <Builder 
                    user={appUser} 
                    siteId={builderMode.siteId}
                    onBack={() => setBuilderMode({ active: false })}
                />
              ) : appUser ? (
                <Dashboard 
                    user={appUser}
                    onCreateNew={() => setBuilderMode({ active: true })}
                    onEditSite={(id) => setBuilderMode({ active: true, siteId: id })}
                />
              ) : <div>Error loading user profile</div>}
            </>
          </RequireAuth>
        } />
      </Routes>
    </Router>
  );
};

export default App;