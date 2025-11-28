'use client';

import React from 'react';
import QuickActions from '@/components/dashboard/QuickActions';
import StatsOverview from '@/components/dashboard/StatsOverview';
import TodaySchedule from '@/components/dashboard/TodaySchedule';

import RestorativeTalksList from '@/components/dashboard/RestorativeTalksList';
import ExtraSportPriorityWidget from '@/components/dashboard/ExtraSportPriorityWidget';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-serif">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overzicht van vandaag</p>
        </div>
        <div className="text-lg font-medium text-gray-600 bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-100 hidden md:block">
          {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <QuickActions />

      {/* Stats Overview Cards */}
      <StatsOverview />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-1 h-full">
          <TodaySchedule />
        </div>

        {/* Restorative Talks */}
        <div className="lg:col-span-1 h-full">
          <RestorativeTalksList />
        </div>

        {/* Extra Sport Priority */}
        <div className="lg:col-span-1 h-full">
          <ExtraSportPriorityWidget />
        </div>
      </div>


    </div>
  );
}
