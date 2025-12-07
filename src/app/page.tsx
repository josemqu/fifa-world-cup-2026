'use client';

import { useState } from 'react';
import { GroupStage } from '@/components/GroupStage';
import { KnockoutStage } from '@/components/KnockoutStage';
import { INITIAL_GROUPS } from '@/data/initialData';
import { clsx } from 'clsx';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout'>('groups');
  const [groups] = useState(INITIAL_GROUPS);

  return (
    <main className="min-h-screen">
      <div className="flex space-x-1 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 p-1 mb-8 max-w-md mx-auto md:mx-0">
        <button
          onClick={() => setActiveTab('groups')}
          className={clsx(
            'w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all duration-200',
            activeTab === 'groups'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-100 shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/12 hover:text-slate-800 dark:hover:text-white'
          )}
        >
          Fase de Grupos
        </button>
        <button
          onClick={() => setActiveTab('knockout')}
          className={clsx(
            'w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 transition-all duration-200',
            activeTab === 'knockout'
              ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-100 shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-white/12 hover:text-slate-800 dark:hover:text-white'
          )}
        >
          Fase Eliminatoria
        </button>
      </div>

      <div className="mt-2">
        {activeTab === 'groups' ? (
          <GroupStage />
        ) : (
          <KnockoutStage groups={groups} />
        )}
      </div>
    </main>
  );
}
