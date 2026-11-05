/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider prompt
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

/**
 * Sign in with real Google Account using Popup
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
    };
  } catch (err: any) {
    console.error('Google Sign-In Error:', err);
    // User closed popup or cancelled
    if (err?.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'تم إلغاء نافذة تسجيل الدخول من قبل المستخدم' };
    }
    if (err?.code === 'auth/cancelled-popup-request') {
      return { success: false, error: 'تم إلغاء الطلب المكرر' };
    }
    return {
      success: false,
      error: err?.message || 'تعذر تسجيل الدخول بحساب Google، يرجى المحاولة مرة أخرى.',
    };
  }
}

/**
 * Create a new account with email & password
 */
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    return { success: true, user: cred.user };
  } catch (err: any) {
    console.error('Registration Error:', err);
    if (err?.code === 'auth/email-already-in-use') {
      return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.' };
    }
    if (err?.code === 'auth/weak-password') {
      return { success: false, error: 'كلمة المرور ضعيفة جداً، يرجى إدخال 6 أحرف على الأقل.' };
    }
    if (err?.code === 'auth/invalid-email') {
      return { success: false, error: 'صيغة البريد الإلكتروني غير صحيحة.' };
    }
    return { success: false, error: err?.message || 'تعذر إنشاء الحساب، يرجى التأكد من البيانات.' };
  }
}

/**
 * Sign in with existing email & password
 */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    return { success: true, user: cred.user };
  } catch (err: any) {
    console.error('Login Error:', err);
    if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
      return { success: false, error: 'بيانات الدخول غير صحيحة.' };
    }
    return { success: false, error: err?.message || 'فشل تسجيل الدخول بالبريد الإلكتروني.' };
  }
}

/**
 * Sign out of Firebase
 */
export async function firebaseSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out warning:', err);
  }
}
