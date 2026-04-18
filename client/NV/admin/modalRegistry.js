import { reactive } from 'vue';

/**
 * Глобальный реактивный реестр свёрнутых модалок.
 * Каждый экземпляр Modal регистрирует себя при сворачивании
 * и удаляет запись при восстановлении или закрытии.
 *
 * Структура записи:
 * {
 *   [modalId]: {
 *     title:   string,
 *     restore: () => void,
 *     close:   () => void,
 *   }
 * }
 */
export const minimizedRegistry = reactive({});

export function registerMinimized(modalId, title, restore, close) {
    minimizedRegistry[modalId] = { title, restore, close };
}

export function unregisterMinimized(modalId) {
    delete minimizedRegistry[modalId];
}