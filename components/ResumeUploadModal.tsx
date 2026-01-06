import React from 'react';
import { X } from 'react-feather';
import ResumeUpload from './ResumeUpload';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ResumeUploadModal({ isOpen, onClose, onSuccess }: Props) {
    if (!isOpen) return null;

    const handleEmployeeCreated = () => {
        onSuccess();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-gradient-to-r from-emerald-600 to-teal-600">
                    <h2 className="text-xl font-semibold text-white">Upload Resume</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                    <ResumeUpload onEmployeeCreated={handleEmployeeCreated} />
                </div>
            </div>
        </div>
    );
}
