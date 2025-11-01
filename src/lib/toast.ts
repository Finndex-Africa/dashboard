import toast from 'react-hot-toast';

export const showToast = {
    success: (message: string) => {
        toast.success(message, {
            style: {
                background: '#fff',
                color: '#333',
                fontWeight: '500',
            },
        });
    },

    error: (message: string) => {
        toast.error(message, {
            style: {
                background: '#fff',
                color: '#333',
                fontWeight: '500',
            },
        });
    },

    warning: (message: string) => {
        toast(message, {
            icon: '⚠️',
            style: {
                background: '#fff',
                color: '#333',
                fontWeight: '500',
                border: '1px solid #ffa94d20',
            },
        });
    },

    loading: (message: string) => {
        return toast.loading(message, {
            style: {
                background: '#fff',
                color: '#333',
                fontWeight: '500',
            },
        });
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        }
    ) => {
        return toast.promise(promise, messages, {
            style: {
                background: '#fff',
                color: '#333',
                fontWeight: '500',
            },
        });
    },
};
