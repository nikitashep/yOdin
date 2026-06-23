import {
  collection,
  addDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Report, ReportStatus } from '../types';

// Anyone signed in can file a report against a post or a forum question.
export async function createReport(data: {
  targetType: 'post' | 'discussion';
  targetId: string;
  targetTitle: string;
  targetAuthorId: string;
  reportedBy: string;
  reason: string;
}): Promise<void> {
  await addDoc(collection(db, 'reports'), {
    ...data,
    status: 'pending' as ReportStatus,
    createdAt: serverTimestamp(),
  });
}

// Live stream of all reports (newest first). Readable only by moderators —
// the security rules reject this listener for everyone else.
export function subscribeReports(onChange: (reports: Report[]) => void): () => void {
  const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report))),
    () => {
      // Silent: a transient/permission listener error shouldn't crash the shell.
    },
  );
}

// Moderator decision: 'removed' (target deleted) or 'kept' (left in place).
export async function resolveReport(reportId: string, status: ReportStatus): Promise<void> {
  await updateDoc(doc(db, 'reports', reportId), { status });
}
