import React from 'react';
import Head from 'next/head';
import TeamBuilder from '../components/TeamBuilder';

export default function ProjectWithAIPage() {
    return (
        <>
            <Head>
                <title>Project with AI | Team Builder</title>
                <meta name="description" content="AI-powered team building based on skills and compatibility" />
            </Head>
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
                <div className="max-w-4xl mx-auto px-6">
                    <header className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Project with AI</h1>
                        <p className="text-slate-600">
                            Use AI to build dream teams based on project requirements and team compatibility
                        </p>
                    </header>
                    
                    <TeamBuilder />
                </div>
            </div>
        </>
    );
}
