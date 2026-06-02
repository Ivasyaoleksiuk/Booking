import { Loader2, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const SUGGESTIONS = [
    '✍️ Напиши опис послуги «Манікюр»',
    '⏰ Які робочі години краще встановити?',
    '📝 Текст привітання для нового клієнта',
    '⚙️ Як налаштувати паузи між записами?',
    '💬 Текст підтвердження запису для клієнта',
    '🎯 Слоган для нашого салону',
];

function formatMessage(text: string) {
    // Simple markdown-like formatting
    return text
        .split('\n')
        .map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**'))
                return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
            if (line.startsWith('# '))
                return <p key={i} className="font-bold text-sm mt-1">{line.slice(2)}</p>;
            if (line.startsWith('- ') || line.startsWith('• '))
                return <p key={i} className="pl-2">• {line.slice(2)}</p>;
            if (line === '')
                return <span key={i} className="block h-1" />;
            return <p key={i}>{line}</p>;
        });
}

export function AiChat() {
    const [open, setOpen]         = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput]       = useState('');
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const bottomRef               = useRef<HTMLDivElement>(null);
    const inputRef                = useRef<HTMLInputElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 100);
    }, [open]);

    const send = async (text: string) => {
        const content = text.trim();
        if (!content || loading) return;

        const updated: Message[] = [...messages, { role: 'user', content }];
        setMessages(updated);
        setInput('');
        setLoading(true);
        setError('');

        try {
            const csrf = (document.querySelector('meta[name=csrf-token]') as HTMLMetaElement)?.content ?? '';

            const res = await fetch('/admin/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    'X-Inertia': 'false',
                },
                body: JSON.stringify({ messages: updated }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                setError(data.error ?? 'Помилка сервера');
            } else {
                setMessages([...updated, { role: 'assistant', content: data.message }]);
            }
        } catch {
            setError("Не вдалося з'єднатися з сервером.");
        } finally {
            setLoading(false);
        }
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send(input);
        }
    };

    const clearChat = () => {
        setMessages([]);
        setError('');
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #4285f4, #0f9d58)' }}
                title="Gemini — ШІ-помічник"
            >
                <Sparkles className="h-6 w-6 text-white" />
            </button>

            {/* Chat window */}
            {open && (
                <div
                    className="fixed bottom-24 right-6 z-50 flex w-[400px] flex-col rounded-2xl border bg-white shadow-2xl"
                    style={{ height: '560px' }}
                >
                    {/* Header */}
                    <div
                        className="flex items-center justify-between rounded-t-2xl px-4 py-3"
                        style={{ background: 'linear-gradient(135deg, #4285f4, #0f9d58)' }}
                    >
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-white" />
                            <div>
                                <p className="text-sm font-bold text-white leading-none">Gemini</p>
                                <p className="text-xs text-white/70 leading-tight">ШІ-помічник салону</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {messages.length > 0 && (
                                <button
                                    onClick={clearChat}
                                    className="text-xs text-white/70 hover:text-white underline"
                                >
                                    очистити
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
                        {messages.length === 0 && (
                            <div>
                                <p className="text-center text-gray-500 mb-1 text-xs">
                                    Привіт! Я Gemini — допоможу наповнити ваш салон контентом, налаштувати логіку та підібрати часові інтервали.
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => send(s.replace(/^[^\s]+ /, ''))}
                                            className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                         style={{ background: 'linear-gradient(135deg, #4285f4, #0f9d58)' }}>
                                        <Sparkles className="h-3 w-3 text-white" />
                                    </div>
                                )}
                                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'rounded-br-sm bg-gray-900 text-white'
                                        : 'rounded-bl-sm bg-gray-100 text-gray-800'
                                }`}>
                                    <div className="space-y-0.5">
                                        {formatMessage(msg.content)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full"
                                     style={{ background: 'linear-gradient(135deg, #4285f4, #0f9d58)' }}>
                                    <Sparkles className="h-3 w-3 text-white" />
                                </div>
                                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
                                    <span className="text-xs text-gray-500">Gemini думає...</span>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                                ⚠️ {error}
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t p-3 flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Запитайте Gemini..."
                            disabled={loading}
                            className="flex-1 rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                        />
                        <button
                            onClick={() => send(input)}
                            disabled={loading || !input.trim()}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-white transition disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #4285f4, #0f9d58)' }}
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
