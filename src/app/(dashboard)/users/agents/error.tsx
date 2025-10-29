'use client';

import Alert from 'antd/es/alert';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <Alert
            message="Error"
            description={error.message || 'Something went wrong while loading agents.'}
            type="error"
            showIcon
            action={
                <button
                    onClick={reset}
                    className="bg-red-100 text-red-800 px-4 py-2 rounded hover:bg-red-200 transition-colors"
                >
                    Try again
                </button>
            }
        />
    );
}
