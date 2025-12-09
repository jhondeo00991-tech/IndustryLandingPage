import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { AppUser, SiteData } from '../types';
import { Icons } from './Icons';

interface DashboardProps {
  user: AppUser;
  onCreateNew: () => void;
  onEditSite: (siteId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onCreateNew, onEditSite }) => {
  const [sites, setSites] = useState<SiteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user.displayName || '');

  useEffect(() => {
    fetchSites();
  }, [user.uid]);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const sitesRef = collection(db, "users", user.uid, "sites");
      const q = query(sitesRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedSites: SiteData[] = [];
      querySnapshot.forEach((doc) => {
        fetchedSites.push(doc.data() as SiteData);
      });
      setSites(fetchedSites);
    } catch (error) {
      console.error("Error fetching sites:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (auth.currentUser) {
        await auth.currentUser.updateProfile({ displayName: newDisplayName });
        setShowAccountModal(false);
        window.location.reload(); // Simple reload to refresh auth state in parent
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
        
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Icons.Dashboard className="text-brand-600"/> 
                SiteBuilder
            </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <button className="w-full flex items-center gap-3 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg font-medium">
                <Icons.Dashboard className="w-5 h-5"/> My Sites
            </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
            <button 
                onClick={() => setShowAccountModal(true)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left"
            >
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.displayName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Icons.Settings className="w-4 h-4 text-gray-400"/>
            </button>
            <button 
                onClick={() => auth.signOut()}
                className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition"
            >
                <Icons.Logout className="w-4 h-4"/> Sign Out
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Sites</h2>
                    <p className="text-gray-500">Manage and publish your landing pages.</p>
                </div>
                <button 
                    onClick={onCreateNew}
                    className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition flex items-center gap-2 shadow-sm"
                >
                    <Icons.Plus className="w-5 h-5"/> Create Site
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Icons.Loader className="w-8 h-8 animate-spin text-gray-300"/>
                </div>
            ) : sites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.Layout className="w-8 h-8 text-gray-400"/>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No sites created yet</h3>
                    <p className="text-gray-500 mb-6">Start building your first AI-powered landing page.</p>
                    <button 
                        onClick={onCreateNew}
                        className="text-brand-600 font-medium hover:underline"
                    >
                        Create your first site
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sites.map(site => (
                        <div key={site.siteId} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition group">
                            <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                                <span className="text-4xl">📄</span>
                                {site.status === 'published' && (
                                    <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                        Published
                                    </span>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                    <button 
                                        onClick={() => onEditSite(site.siteId)}
                                        className="bg-white text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-100"
                                    >
                                        Edit
                                    </button>
                                    {site.status === 'published' && (
                                         <a 
                                            href={`#/s/${site.siteId}`} 
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-brand-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-brand-700"
                                         >
                                            View
                                         </a>
                                    )}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-900 truncate">{site.title}</h3>
                                <p className="text-sm text-gray-500 mt-1 truncate">{site.prompt.businessType}</p>
                                <p className="text-xs text-gray-400 mt-3">
                                    Updated {new Date(site.updatedAt.seconds * 1000).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
                <h3 className="text-lg font-bold mb-4">Account Settings</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="text" value={user.email || ''} disabled className="w-full bg-gray-100 p-2 rounded border border-gray-200 text-gray-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input 
                            type="text" 
                            value={newDisplayName} 
                            onChange={(e) => setNewDisplayName(e.target.value)}
                            className="w-full p-2 rounded border border-gray-300 focus:ring-2 focus:ring-brand-500 outline-none" 
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <button onClick={() => setShowAccountModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                    <button onClick={handleUpdateProfile} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">Save Changes</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};