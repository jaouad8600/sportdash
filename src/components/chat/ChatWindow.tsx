'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChatMessages } from '@/hooks/useSportData';
import { useAuth } from '@/components/providers/AuthContext';
import { Send, User as UserIcon, Hash, MoreVertical, Phone, Video } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';

const CHANNELS = ['Algemeen', 'Sport', 'Dagdienst', 'Avonddienst', 'Nachtdienst', 'Medisch', 'Management'];

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const Avatar = ({ name }: { name: string }) => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
        {getInitials(name)}
    </div>
);

export default function ChatWindow() {
    const { user } = useAuth();
    const [activeChannel, setActiveChannel] = useState('Algemeen');
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data: messages, isLoading, sendMessage } = useChatMessages(activeChannel);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            await sendMessage.mutateAsync({
                channel: activeChannel,
                content: newMessage,
                sender: user.name || 'Onbekend',
            });
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Sidebar / Channel List */}
            <div className="w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Hash className="text-blue-600" size={20} />
                        Kanalen
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {CHANNELS.map((channel) => (
                        <button
                            key={channel}
                            onClick={() => setActiveChannel(channel)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${activeChannel === channel
                                ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-semibold shadow-sm border border-gray-200 dark:border-gray-700'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                                }`}
                        >
                            <span className="text-lg">#</span>
                            {channel}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                        <Avatar name={user?.name || "User"} />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user?.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                Online
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm z-10">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
                            <Hash size={20} className="text-gray-400" />
                            {activeChannel}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">Onderwerp: {activeChannel} zaken</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <Phone size={20} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <Video size={20} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 dark:bg-gray-900/30">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : messages?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Hash size={32} />
                            </div>
                            <p>Nog geen berichten in #{activeChannel}.</p>
                            <p className="text-sm">Wees de eerste die iets zegt!</p>
                        </div>
                    ) : (
                        messages?.map((msg, index) => {
                            const isMe = msg.sender === user?.name;
                            const showDateSeparator = index === 0 || !isSameDay(new Date(msg.createdAt), new Date(messages[index - 1].createdAt));

                            return (
                                <React.Fragment key={msg.id}>
                                    {showDateSeparator && (
                                        <div className="flex justify-center my-6">
                                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-500 rounded-full border border-gray-200 dark:border-gray-700">
                                                {format(new Date(msg.createdAt), 'd MMMM yyyy', { locale: nl })}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        {!isMe && <Avatar name={msg.sender} />}
                                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    {isMe ? 'Jij' : msg.sender}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    {format(new Date(msg.createdAt), 'HH:mm')}
                                                </span>
                                            </div>
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${isMe
                                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-200 dark:border-gray-600'
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                    <form onSubmit={handleSend} className="flex gap-3 items-end max-w-4xl mx-auto">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={`Schrijf een bericht in #${activeChannel}...`}
                                className="w-full pl-4 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sendMessage.isPending}
                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 hover:shadow-blue-300 active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
