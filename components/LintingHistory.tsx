'use client'

import { useEffect } from 'react';
import { useLintingHistoryStore } from '@/store/useLintingHistoryStore';

export default function LintingHistory({ onRestore }: { onRestore: (code: string) => void }) {
  const { history, loadHistory, deleteHistory } = useLintingHistoryStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-4 p-4 border rounded-lg bg-gray-100 shadow">
      <h2 className="text-lg font-semibold">Linting History</h2>
      <ul className="border p-2 rounded-lg bg-gray-200 max-h-40 overflow-auto">
        {history.length === 0 ? (
          <li className="p-2 text-gray-500">No history yet.</li>
        ) : (
          history.map((item) => (
            <li key={item.id} className="flex justify-between items-center p-2 border-b">
              <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
              <div>
                <button
                  onClick={() => onRestore(item.code)}
                  className="px-2 py-1 bg-green-600 text-white rounded mr-2"
                >
                  Restore
                </button>
                <button
                  onClick={() => deleteHistory(item.id!)}
                  className="px-2 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}