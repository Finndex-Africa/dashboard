export const LIST_PAGE_SIZE = 10;

export interface ListPagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}

export const EMPTY_LIST_PAGINATION: ListPagination = {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: LIST_PAGE_SIZE,
};

export function extractListItems<T>(response: unknown): T[] {
    if (!response || typeof response !== 'object') return [];
    const root = response as Record<string, unknown>;

    if (Array.isArray(root)) return root as T[];
    if (Array.isArray(root.data)) return root.data as T[];

    const nested = root.data;
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
        const inner = (nested as Record<string, unknown>).data;
        if (Array.isArray(inner)) return inner as T[];
    }

    return [];
}

export function extractListPagination(
    response: unknown,
    fallbackCount: number,
    page = 1,
    pageSize = LIST_PAGE_SIZE,
): ListPagination {
    if (!response || typeof response !== 'object') {
        return {
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(fallbackCount / pageSize) || 1),
            totalItems: fallbackCount,
            itemsPerPage: pageSize,
        };
    }

    const root = response as Record<string, unknown>;
    const nested =
        root.data && typeof root.data === 'object' && !Array.isArray(root.data)
            ? (root.data as Record<string, unknown>)
            : {};
    const pag = (root.pagination || nested.pagination) as Record<string, unknown> | undefined;

    if (pag && typeof pag === 'object') {
        const totalItems = Number(pag.totalItems ?? pag.total ?? fallbackCount) || fallbackCount;
        const itemsPerPage = Number(pag.itemsPerPage ?? pag.limit ?? pageSize) || pageSize;
        const currentPage = Number(pag.currentPage ?? pag.page ?? page) || page;
        const totalPages = Number(
            pag.totalPages ?? Math.max(1, Math.ceil(totalItems / itemsPerPage) || 1),
        );
        return { currentPage, totalPages, totalItems, itemsPerPage };
    }

    return {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(fallbackCount / pageSize) || 1),
        totalItems: fallbackCount,
        itemsPerPage: pageSize,
    };
}

export function tablePaginationConfig(
    pagination: ListPagination,
    onChange: (page: number) => void,
    noun: string,
) {
    return {
        current: pagination.currentPage,
        total: pagination.totalItems,
        pageSize: pagination.itemsPerPage || LIST_PAGE_SIZE,
        onChange: (page: number) => onChange(page),
        showSizeChanger: false,
        hideOnSinglePage: true,
        showTotal: (total: number) => `Total ${total} ${noun}`,
    };
}
