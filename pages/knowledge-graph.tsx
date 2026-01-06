import React from 'react';
import Head from 'next/head';
import KnowledgeGraph from '../components/KnowledgeGraph';

export default function KnowledgeGraphPage() {
    return (
        <>
            <Head>
                <title>Knowledge Graph | SurrealDB Demo</title>
                <meta
                    name="description"
                    content="Visualize employee skills and relationships in an interactive knowledge graph"
                />
            </Head>
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-neutral-900">
                            Knowledge Graph
                        </h1>
                        <p className="text-neutral-600 mt-2">
                            Interactive visualization of employees, skills, and their relationships in SurrealDB
                        </p>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
                        <KnowledgeGraph />
                    </div>
                </div>
            </div>
        </>
    );
}
