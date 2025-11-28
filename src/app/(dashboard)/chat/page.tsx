import React from 'react';
import ChatWindow from '@/components/chat/ChatWindow';

export default function ChatPage() {
    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">
                    Interne Chat
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Communiceer direct met collega's en deel updates.
                </p>
            </div>

            <ChatWindow />
        </div>
    );
}
