import { Timestamp } from 'firebase/firestore';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  lastSeen: Timestamp;
}

export interface SiteData {
  siteId: string;
  ownerUid: string;
  title: string;
  prompt: SitePrompt;
  html: string;
  status: 'draft' | 'published';
  meta: {
    seoTitle: string;
    seoDescription: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface PublicSiteData {
  siteId: string;
  ownerUid: string;
  title: string;
  html: string;
  meta: {
    seoTitle: string;
    seoDescription: string;
  };
  publishedAt: Timestamp;
  status: 'published';
}

export interface SitePrompt {
  title: string;
  businessType: string;
  targetAudience: string;
  colorTheme: string;
  features: string;
  ctaText: string;
}

export enum ViewState {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  BUILDER = 'BUILDER',
  PUBLIC = 'PUBLIC'
}
