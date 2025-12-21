
import React, { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-bold text-slate-400 mb-1">{label}</label>}
            <input
                className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-600 focus:border-wood-500'} rounded-lg p-3 text-white outline-none transition-colors placeholder:text-slate-600 ${className}`}
                {...props}
            />
            {error && <span className="text-red-400 text-xs mt-1 block">{error}</span>}
        </div>
    );
};

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, error, className = '', ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-bold text-slate-400 mb-1">{label}</label>}
            <textarea
                className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-600 focus:border-wood-500'} rounded-lg p-3 text-white outline-none transition-colors placeholder:text-slate-600 resize-none ${className}`}
                {...props}
            />
            {error && <span className="text-red-400 text-xs mt-1 block">{error}</span>}
        </div>
    );
};
