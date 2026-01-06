import React from 'react';
import Head from 'next/head';
import SkillChat from '../components/SkillChat';

export default function ChatbotPage() {
    return (
        <>
            <Head>
                <title>Skill Search Chatbot | SurrealDB Demo</title>
                <meta
                    name="description"
                    content="Search for employees by skills using our AI-powered chatbot"
                />
            </Head>
            <div className="mt-36 mx-4 mb-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-neutral-900">
                            Skill Search Chatbot
                        </h1>
                        <p className="text-neutral-600 mt-2">
                            Find employees by describing the skills you need. Try asking something like &quot;I need someone with Python and machine learning experience&quot;
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
                        <SkillChat />
                    </div>
                </div>
            </div>
        </>
    );
}
