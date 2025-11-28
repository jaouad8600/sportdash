'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { useState, useEffect } from 'react';

// Map routes to Dutch labels
const routeLabels: Record<string, string> = {
    '': 'Dashboard',
    'groepen': 'Groepen',
    'rapportages': 'Rapportages',
    'sportmutaties': 'Sportmutaties',
    'sportindicaties': 'Sportindicaties',
    'incidenten': 'Incidenten',
    'materialen': 'Materialen',
    'documenten': 'Documenten',
    'programmas': "Programma's",
    'kalender': 'Kalender',
    'sportmomenten': 'Dagplanning',
    'extra-sport': 'Extra Sport',
    'extra-sportmomenten': 'Extra Sportmomenten',
    'input': 'Snelle Invoer',
    'admin': 'Beheer',
    'audit': 'Audit Log',
    'instellingen': 'Instellingen',
    'dagrapport': 'Dagrapport',
};

export default function Breadcrumbs() {
    const pathname = usePathname();

    // Split path and filter empty strings
    const segments = pathname.split('/').filter(Boolean);

    const [segmentLabels, setSegmentLabels] = useState<Record<string, string>>({});

    useEffect(() => {
        const resolveLabels = async () => {
            const newLabels: Record<string, string> = {};
            const uuidSegments = segments.filter(s =>
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
            );

            if (uuidSegments.length > 0) {
                try {
                    // Try to fetch group details for UUIDs
                    // This is a simple implementation; ideally we'd have a more robust lookup
                    const res = await fetch('/api/groups');
                    if (res.ok) {
                        const groups = await res.json();
                        if (Array.isArray(groups)) {
                            groups.forEach((g: any) => {
                                newLabels[g.id] = g.name;
                            });
                        }
                    }
                } catch (e) {
                    console.error("Failed to resolve breadcrumb labels", e);
                }
            }
            setSegmentLabels(newLabels);
        };

        resolveLabels();
    }, [pathname]);

    // Don't show breadcrumbs on home page
    if (segments.length === 0) {
        return null;
    }

    // Build breadcrumb items
    const breadcrumbs = segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        // Use resolved label if available, otherwise static map, otherwise segment itself
        const label = segmentLabels[segment] || routeLabels[segment] || segment;
        const isLast = index === segments.length - 1;

        return {
            label,
            path,
            isLast,
        };
    });

    return (
        <nav className="flex items-center space-x-2 text-sm mb-6 px-1">
            {/* Home link */}
            <Link
                href="/"
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors group"
            >
                <Home size={16} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">Home</span>
            </Link>

            {/* Breadcrumb items */}
            {breadcrumbs.map((crumb, index) => (
                <div key={crumb.path} className="flex items-center space-x-2">
                    <ChevronRight size={16} className="text-gray-400" />
                    {crumb.isLast ? (
                        <span className="font-semibold text-gray-900 dark:text-white px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            {crumb.label}
                        </span>
                    ) : (
                        <Link
                            href={crumb.path}
                            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors font-medium hover:underline px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}
