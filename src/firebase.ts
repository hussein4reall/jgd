import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where,
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  increment,
  runTransaction,
  getDocFromServer,
  getDocs
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, Clip, Story, PioneerTierType } from './types';
import { getPioneerTier } from './translations';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass database ID as second argument
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection on boot
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or connecting...');
    }
  }
}
testConnection();

// Standard error handler conforming to skill specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// In-flight singleton lock to prevent race conditions during concurrent auth callbacks
const inFlightProfileCreations = new Map<string, Promise<User>>();

// Ensure User Document in Firestore with race condition prevention and auto-healing
export function getOrCreateUserProfile(
  fbUser: FirebaseUser, 
  customUsername?: string, 
  customDisplayName?: string
): Promise<User> {
  const existing = inFlightProfileCreations.get(fbUser.uid);
  if (existing) {
    return existing;
  }

  const promise = (async () => {
    try {
      return await internalGetOrCreateUserProfile(fbUser, customUsername, customDisplayName);
    } finally {
      inFlightProfileCreations.delete(fbUser.uid);
    }
  })();

  inFlightProfileCreations.set(fbUser.uid, promise);
  return promise;
}

async function internalGetOrCreateUserProfile(
  fbUser: FirebaseUser, 
  customUsername?: string, 
  customDisplayName?: string
): Promise<User> {
  const userRef = doc(db, 'users', fbUser.uid);
  const isFounderEmail = 
    fbUser.email?.toLowerCase() === 'std2025.hyousif@uowasit.edu.iq' ||
    Boolean(fbUser.email?.toLowerCase().includes('hyousif'));

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const existingData = userSnap.data() as User;

      // Auto-healing logic:
      // If the user is the founder, OR their account is #2 while being the sole user or there is no account #1:
      // We automatically heal it back to Account #1 and Pioneer #1 (first_ever).
      if (existingData.accountNumber !== 1) {
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          const otherDocs = usersSnap.docs.filter((d) => d.id !== fbUser.uid);
          const otherHasAccountOne = otherDocs.some((d) => (d.data() as User).accountNumber === 1);

          if (isFounderEmail || !otherHasAccountOne || otherDocs.length === 0) {
            const repairedUser: User = {
              ...existingData,
              accountNumber: 1,
              pioneerTier: 'first_ever',
            };

            await updateDoc(userRef, {
              accountNumber: 1,
              pioneerTier: 'first_ever',
            });

            const statsRef = doc(db, 'app_stats', 'counters');
            await setDoc(
              statsRef,
              { totalRegisteredUsers: Math.max(1, usersSnap.size), lastUpdated: new Date().toISOString() },
              { merge: true }
            );

            return repairedUser;
          }
        } catch (healErr) {
          console.warn('Auto-repair account check error:', healErr);
        }
      }

      return existingData;
    }

    // Determine account number by inspecting real Firestore users collection
    let accountNumber = 1;

    if (isFounderEmail) {
      accountNumber = 1;
    } else {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          accountNumber = 1;
        } else {
          const existingNumbers = usersSnap.docs
            .map((d) => (d.data() as User).accountNumber)
            .filter((n): n is number => typeof n === 'number' && !isNaN(n));
          
          if (!existingNumbers.includes(1)) {
            accountNumber = 1;
          } else {
            const maxNumber = Math.max(0, ...existingNumbers);
            accountNumber = maxNumber + 1;
          }
        }
      } catch (err) {
        console.warn('Fallback getting users list for account number:', err);
        accountNumber = 1;
      }
    }

    // Keep global counter in sync
    try {
      const statsRef = doc(db, 'app_stats', 'counters');
      await setDoc(
        statsRef,
        { totalRegisteredUsers: accountNumber, lastUpdated: new Date().toISOString() },
        { merge: true }
      );
    } catch {}

    const tier: PioneerTierType = getPioneerTier(accountNumber);
    const generatedUsername =
      customUsername?.trim() ||
      (fbUser.email
        ? fbUser.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
        : `pioneer_${accountNumber}`);
    const finalDisplayName =
      customDisplayName?.trim() || fbUser.displayName || generatedUsername;
    const finalAvatar =
      fbUser.photoURL ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${generatedUsername}&backgroundColor=030307`;

    const newUser: User = {
      id: fbUser.uid,
      username: generatedUsername,
      displayName: finalDisplayName,
      email: fbUser.email || '',
      avatarUrl: finalAvatar,
      bio: 'Exploring 15-second clips and seasonal competitions.',
      accountNumber,
      registeredAt: new Date().toISOString(),
      joinedDate: new Date().toISOString(),
      pioneerTier: tier,
      followersCount: 0,
      followingCount: 0,
      totalLikes: 0,
      awardsWon: [],
    };

    await setDoc(userRef, newUser);
    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${fbUser.uid}`);
    throw error;
  }
}

// Explicit helper to force reset/repair account #1 for the active user if needed
export async function repairCurrentAccountToOne(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    const data = snap.data() as User;
    const repaired: User = {
      ...data,
      accountNumber: 1,
      pioneerTier: 'first_ever',
    };
    await updateDoc(userRef, {
      accountNumber: 1,
      pioneerTier: 'first_ever',
    });
    const statsRef = doc(db, 'app_stats', 'counters');
    await setDoc(statsRef, { totalRegisteredUsers: 1, lastUpdated: new Date().toISOString() }, { merge: true });
    return repaired;
  } catch (e) {
    console.error('Failed to repair account number:', e);
    return null;
  }
}

// Auth wrappers
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return await getOrCreateUserProfile(result.user);
}

export async function signUpWithEmail(email: string, pass: string, username: string, displayName: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    try {
      await updateProfile(result.user, { displayName });
    } catch {}
  }
  return await getOrCreateUserProfile(result.user, username, displayName);
}

export async function logInWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return await getOrCreateUserProfile(result.user);
}

export async function logOut(): Promise<void> {
  await fbSignOut(auth);
}

// Check username uniqueness against both usernames registry and users collection
export async function checkUsernameAvailability(
  username: string, 
  currentUserId?: string
): Promise<{ available: boolean; errorKey?: 'usernameTooShort' | 'usernameInvalid' | 'usernameTaken' }> {
  const clean = username.trim().toLowerCase();
  if (clean.length < 3) {
    return { available: false, errorKey: 'usernameTooShort' };
  }
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(clean)) {
    return { available: false, errorKey: 'usernameInvalid' };
  }

  try {
    // 1. Direct check in unique usernames registry
    const usernameDocRef = doc(db, 'usernames', clean);
    const usernameDocSnap = await getDoc(usernameDocRef);
    if (usernameDocSnap.exists()) {
      const data = usernameDocSnap.data();
      if (data.userId && data.userId !== currentUserId) {
        return { available: false, errorKey: 'usernameTaken' };
      }
    }

    // 2. Query users collection
    const usersQ = query(collection(db, 'users'), where('username', '==', clean));
    const usersSnap = await getDocs(usersQ);
    for (const d of usersSnap.docs) {
      if (d.id !== currentUserId) {
        return { available: false, errorKey: 'usernameTaken' };
      }
    }

    return { available: true };
  } catch (error) {
    console.warn('Username check notice:', error);
    try {
      const allUsers = await getDocs(collection(db, 'users'));
      const conflict = allUsers.docs.some(
        (d) => d.id !== currentUserId && ((d.data() as User).username || '').toLowerCase() === clean
      );
      if (conflict) {
        return { available: false, errorKey: 'usernameTaken' };
      }
      return { available: true };
    } catch {
      return { available: true };
    }
  }
}

// Update user profile with strict 5-name-edits limit, unique username, and avatar handling
export async function updateUserProfile(
  userId: string,
  updates: {
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    bio?: string;
  }
): Promise<User> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    throw new Error('User document not found');
  }

  const currentUserData = snap.data() as User;
  const newUsername = updates.username?.trim().toLowerCase();
  const newDisplayName = updates.displayName?.trim();
  const currentNameEdits = currentUserData.nameEditsCount || 0;

  // 1. Validate Username uniqueness if changed
  if (newUsername && newUsername !== currentUserData.username.toLowerCase()) {
    const avail = await checkUsernameAvailability(newUsername, userId);
    if (!avail.available) {
      throw new Error(avail.errorKey || 'usernameTaken');
    }

    // Claim new username
    try {
      await setDoc(doc(db, 'usernames', newUsername), {
        userId,
        claimedAt: new Date().toISOString()
      });
      // Release old username if different
      if (currentUserData.username && currentUserData.username.toLowerCase() !== newUsername) {
        await deleteDoc(doc(db, 'usernames', currentUserData.username.toLowerCase()));
      }
    } catch (e) {
      console.warn('Username registry sync notice:', e);
    }
  }

  // 2. Validate Display Name 5-edit limit
  let updatedNameEditsCount = currentNameEdits;
  let finalDisplayName = currentUserData.displayName;

  if (newDisplayName && newDisplayName !== currentUserData.displayName) {
    if (currentNameEdits >= 5) {
      throw new Error('nameEditsExhausted');
    }
    updatedNameEditsCount = currentNameEdits + 1;
    finalDisplayName = newDisplayName;
  }

  const updatedProfile: User = {
    ...currentUserData,
    displayName: finalDisplayName,
    username: newUsername || currentUserData.username,
    avatarUrl: updates.avatarUrl || currentUserData.avatarUrl,
    bio: updates.bio !== undefined ? updates.bio : currentUserData.bio,
    nameEditsCount: updatedNameEditsCount,
  };

  try {
    await updateDoc(userRef, {
      displayName: updatedProfile.displayName,
      username: updatedProfile.username,
      avatarUrl: updatedProfile.avatarUrl,
      bio: updatedProfile.bio,
      nameEditsCount: updatedProfile.nameEditsCount,
    });

    // Also update auth user profile if displayName changed
    if (auth.currentUser && auth.currentUser.uid === userId) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: updatedProfile.displayName,
          photoURL: updatedProfile.avatarUrl.length < 2000 ? updatedProfile.avatarUrl : undefined
        });
      } catch {}
    }

    // Propagate changes to user's clips and stories in background so UI stays synchronized
    try {
      const clipsQ = query(collection(db, 'clips'), where('userId', '==', userId));
      const clipsSnap = await getDocs(clipsQ);
      for (const cDoc of clipsSnap.docs) {
        await updateDoc(doc(db, 'clips', cDoc.id), {
          'user.displayName': updatedProfile.displayName,
          'user.username': updatedProfile.username,
          'user.avatarUrl': updatedProfile.avatarUrl,
        });
      }

      const storiesQ = query(collection(db, 'stories'), where('userId', '==', userId));
      const storiesSnap = await getDocs(storiesQ);
      for (const sDoc of storiesSnap.docs) {
        await updateDoc(doc(db, 'stories', sDoc.id), {
          'user.displayName': updatedProfile.displayName,
          'user.username': updatedProfile.username,
          'user.avatarUrl': updatedProfile.avatarUrl,
        });
      }
    } catch (propagationErr) {
      console.warn('Clip/Story author data sync notice:', propagationErr);
    }

    return updatedProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    throw error;
  }
}

