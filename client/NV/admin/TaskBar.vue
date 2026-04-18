<script>
import { minimizedRegistry } from './modalRegistry.js';

export default {
  name: 'Taskbar',

  computed: {
    items() {
      return Object.entries(minimizedRegistry).map(([id, data]) => ({
        id,
        ...data,
      }));
    },
  },
};
</script>

<template>
  <Teleport to="body">
    <Transition name="taskbar-fade">
      <div v-if="items.length > 0" class="modal-taskbar">
        <TransitionGroup name="taskbar-item" tag="div" class="taskbar-list">
          <div
              v-for="item in items"
              :key="item.id"
              class="taskbar-item"
              :title="'Восстановить: ' + item.title"
              @click="item.restore()"
          >
            <i class="fas fa-window-restore taskbar-item-icon"></i>
            <span class="taskbar-item-title">{{ item.title }}</span>
            <button
                class="taskbar-item-close"
                type="button"
                :title="'Закрыть: ' + item.title"
                @click.stop="item.close()"
            >
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </TransitionGroup>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ─── Панель ──────────────────────────────────────────────────── */
.modal-taskbar {
  position: fixed;
  bottom: 16px;
  left: 92vw;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--background);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 5px 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  max-width: calc(100vw - 40px);
  overflow: hidden;
}

.taskbar-list {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}
.taskbar-list::-webkit-scrollbar { display: none; }

/* ─── Элемент ─────────────────────────────────────────────────── */
.taskbar-item {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 6px 0 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  min-width: 0;
  max-width: 200px;
  flex-shrink: 0;
  user-select: none;
}
.taskbar-item:hover {
  background: var(--hover-secondary, rgba(255,255,255,0.07));
  border-color: var(--border-light);
}

.taskbar-item-icon {
  font-size: 11px;
  color: var(--primary);
  flex-shrink: 0;
}

.taskbar-item-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.taskbar-item-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary, #888);
  font-size: 10px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.taskbar-item-close:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* ─── Transitions ─────────────────────────────────────────────── */
.taskbar-fade-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.taskbar-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.taskbar-fade-enter-from   { opacity: 0; transform: translateX(-50%) translateY(12px); }
.taskbar-fade-leave-to     { opacity: 0; transform: translateX(-50%) translateY(12px); }

.taskbar-item-enter-active { transition: opacity 0.18s ease, transform 0.18s ease, max-width 0.2s ease; }
.taskbar-item-leave-active { transition: opacity 0.14s ease, transform 0.14s ease, max-width 0.18s ease; }
.taskbar-item-enter-from   { opacity: 0; transform: translateY(6px); max-width: 0; }
.taskbar-item-leave-to     { opacity: 0; transform: translateY(4px); max-width: 0; }
</style>