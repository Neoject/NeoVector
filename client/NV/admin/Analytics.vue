<script>
import {Values} from "./service";
import {api} from "../../../server/api";
import {setPageTitle} from "../../../server/src/utils";

export default {
  name: 'Analytics',
  inject: ['params'],
  data() {
    return {
      analyticsData: null,
      analyticsLoading: false,
      analyticsError: '',
      analyticsPeriod: '7',
      analyticsFilters: {
        ip: '',
        url: '',
        referer: '',
        date: '',
        topPagesSearch: ''
      },
      dailyChart: null,
      hourlyChart: null,
    };
  },
  mounted() {
    setPageTitle(this.params.title, 'аналитика');
    this.loadAnalytics();
  },
  beforeUnmount() {
    this.dailyChart?.destroy();
    this.hourlyChart?.destroy();
  },
  computed: {
    filteredRecentVisits() {
      if (!this.analyticsData?.recent_visits) return [];

      let filtered = this.analyticsData.recent_visits.filter(
          visit => !visit.url?.startsWith('/?')
      );

      if (this.analyticsFilters.ip) {
        const ipFilter = this.analyticsFilters.ip.toLowerCase().trim();
        filtered = filtered.filter(visit => visit.ip?.toLowerCase().includes(ipFilter));
      }

      const currentHost = window.location.host || '';

      filtered = filtered.filter(visit => {
        if (!visit.referer) return false;
        try {
          const url = new URL(visit.referer, window.location.origin);
          return !currentHost || url.host !== currentHost;
        } catch {
          return false;
        }
      });

      if (this.analyticsFilters.url) {
        const urlFilter = this.analyticsFilters.url.toLowerCase().trim();

        filtered = filtered.filter(visit => {
          const url = visit.url === '/' ? 'домашняя' : visit.url.toLowerCase();
          return url.includes(urlFilter);
        });
      }

      if (this.analyticsFilters.referer) {
        const refererFilter = this.analyticsFilters.referer.toLowerCase().trim();

        filtered = filtered.filter(
            visit => visit.referer?.toLowerCase().includes(refererFilter)
        );
      }

      if (this.analyticsFilters.date) {
        filtered = filtered.filter(visit => visit.date === this.analyticsFilters.date);
      }

      return filtered;
    },
    filteredTopPages() {
      if (!this.analyticsData?.top_pages) return [];

      const filtered = this.analyticsData.top_pages.filter(
          page => !page.url?.startsWith('/?')
      );

      if (!this.analyticsFilters.topPagesSearch) return filtered;

      const searchFilter = this.analyticsFilters.topPagesSearch.toLowerCase().trim();

      return filtered.filter(page => {
        const url = page.url === '/' ? 'домашняя' : page.url.toLowerCase();
        return url.includes(searchFilter);
      });
    },
    hasActiveFilters() {
      const f = this.analyticsFilters;
      return !!(f.ip || f.url || f.referer || f.date);
    }
  },
  methods: {
    async loadAnalytics() {
      this.analyticsLoading = true;
      this.analyticsError = '';

      try {
        const response = await api.getAnalytics(this.analyticsPeriod);

        if (response.ok) {
          this.analyticsData = await response.json();
          await this.$nextTick(() => {
            this.renderCharts();
            this.initAnalyticsColumnResize();
          });
        } else {
          this.analyticsError = 'Ошибка загрузки аналитики';
        }
      } catch { this.analyticsError = 'Ошибка загрузки аналитики'; }
      this.analyticsLoading = false;
    },
    clearAnalyticsFilters() {
      this.analyticsFilters = {
        ip: '',
        url: '',
        referer: '',
        date: '',
        topPagesSearch: ''
      };
    },
    initAnalyticsColumnResize() {
      this.$nextTick(() => {
        setTimeout(() => {
          const tables = [
            { ref: 'topPagesTable',     prefix: 'analytics_top' },
            { ref: 'recentVisitsTable', prefix: 'analytics_visit' },
          ];

          tables.forEach(({ ref, prefix }) => {
            const table = this.$refs[ref];
            if (!table) return;

            table.querySelectorAll('.column-resize-handle').forEach(handle => {
              const newHandle = handle.cloneNode(true);
              handle.parentNode.replaceChild(newHandle, handle);
              this.setupAnalyticsColumnResize(newHandle, prefix);
            });

            this.loadAnalyticsColumnWidths(prefix, table);
          });
        }, 100);
      });
    },
    setupAnalyticsColumnResize(handle) {
      let isResizing = false;
      let startX = 0;
      let startWidth = 0;
      let column = null;
      let indicator = null;

      const startResize = (e) => {
        if (window.innerWidth <= 768) return;

        e.preventDefault();
        e.stopPropagation();

        isResizing = true;
        startX = e.clientX;
        column = handle.parentElement;
        startWidth = column.offsetWidth;

        indicator = document.createElement('div');
        indicator.className = 'resize-indicator';
        document.body.appendChild(indicator);

        const updateIndicator = (e) => {
          const rect = column.getBoundingClientRect();
          indicator.style.left = (rect.right + (e.clientX - startX)) + 'px';
          indicator.classList.add('active');
        };

        const handleMouseMove = (e) => {
          if (!isResizing) return;
          e.preventDefault();
          updateIndicator(e);
        };

        const stopResize = (e) => {
          if (!isResizing) return;

          const newWidth = Math.max(50, startWidth + (e.clientX - startX));
          column.style.width = newWidth + 'px';
          column.style.minWidth = newWidth + 'px';

          const table = column.closest('table');
          const headerRow = table.querySelector('thead tr');
          const columnIndex = Array.from(headerRow.children).indexOf(column);

          table.querySelectorAll('tbody tr').forEach(row => {
            const cell = row.querySelectorAll('td')[columnIndex];
            if (cell) {
              cell.style.width = newWidth + 'px';
              cell.style.minWidth = newWidth + 'px';
            }
          });

          this.saveAnalyticsColumnWidth(column.dataset.column, newWidth);

          isResizing = false;
          handle.classList.remove('active');

          if (indicator) {
            indicator.classList.remove('active');
            setTimeout(() => indicator?.parentNode?.removeChild(indicator), 200);
          }

          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', stopResize);
        };

        handle.classList.add('active');
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResize);
      };

      handle.addEventListener('mousedown', startResize);
    },
    saveAnalyticsColumnWidth(columnName, width) {
      if (!columnName) return;
      const saved = JSON.parse(localStorage.getItem('admin_analytics_column_widths') || '{}');
      saved[columnName] = width;
      localStorage.setItem('admin_analytics_column_widths', JSON.stringify(saved));
    },
    loadAnalyticsColumnWidths(prefix, table) {
      if (!table) return;

      const saved = JSON.parse(localStorage.getItem('admin_analytics_column_widths') || '{}');

      Object.entries(saved).forEach(([columnName, width]) => {
        if (!columnName.startsWith(prefix)) return;

        const column = table.querySelector(`th[values-column="${columnName}"]`);
        if (!column) return;

        const w = width + 'px';
        column.style.width = w;
        column.style.minWidth = w;

        const headerRow = table.querySelector('thead tr');
        const columnIndex = Array.from(headerRow.children).indexOf(column);

        table.querySelectorAll('tbody tr').forEach(row => {
          const cell = row.querySelectorAll('td')[columnIndex];
          if (cell) {
            cell.style.width = w;
            cell.style.minWidth = w;
          }
        });
      });
    },
    renderCharts() {
      if (!this.analyticsData) return;

      this.dailyChart?.destroy();
      this.hourlyChart?.destroy();

      const dailyCtx = this.$refs.dailyChart;
      if (dailyCtx && this.analyticsData.daily_visits) {
        const dailyLabels = this.analyticsData.daily_visits.map(v =>
            new Date(v.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
        );
        const dailyData = this.analyticsData.daily_visits.map(v => v.count);

        this.dailyChart = new Chart(dailyCtx, {
          type: 'line',
          data: {
            labels: dailyLabels,
            datasets: [{
              label: 'Посещений',
              data: dailyData,
              borderColor: '#3498db',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
          }
        });
      }

      const hourlyCtx = this.$refs.hourlyChart;
      if (hourlyCtx && this.analyticsData.hourly_visits) {
        const hourlyLabels = Array.from({ length: 24 }, (_, i) =>
            i.toString().padStart(2, '0') + ':00'
        );
        const hourlyData = Array.from({ length: 24 }, (_, i) => {
          const hourData = this.analyticsData.hourly_visits.find(h => h.hour === i);
          return hourData ? hourData.count : 0;
        });

        this.hourlyChart = new Chart(hourlyCtx, {
          type: 'bar',
          data: {
            labels: hourlyLabels,
            datasets: [{
              label: 'Посещений',
              data: hourlyData,
              backgroundColor: '#2ecc71',
              borderColor: '#27ae60',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
          }
        });
      }
    },
    getProductName(url) {
      const raw = (url ?? '').toString();
      if (raw === '') return '';
      try {
        const decoded = decodeURIComponent(raw.split('#')[0].split('?')[0].replace(/\/+$/, ''));
        return decoded === '' ? raw : decoded;
      } catch {
        return raw;
      }
    }
  }
};
</script>

<template>
  <div class="admin-content">
    <div class="content-header">
      <h2>Аналитика посещений</h2>
      <div class="header-actions">
        <select
            v-model="analyticsPeriod"
            @change="loadAnalytics"
            class="btn btn-secondary"
            style="padding: 8px 12px;"
        >
          <option value="7">Последние 7 дней</option>
          <option value="30">Последние 30 дней</option>
          <option value="90">Последние 90 дней</option>
          <option value="365">Последний год</option>
        </select>
        <button @click="loadAnalytics" class="btn btn-secondary" :disabled="analyticsLoading">
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': analyticsLoading }"></i>
          <span class="btn-text">Обновить</span>
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div
        class="analytics-filters"
        style="margin: 20px 0; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 8px;"
    >
      <h3 style="margin-bottom: 15px; font-size: 16px;">
        <i class="fas fa-filter"></i> Фильтры и поиск
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 12px; color: #888; margin-bottom: 5px; display: block;">
            Поиск по IP адресу
          </label>
          <input
              type="text"
              v-model="analyticsFilters.ip"
              placeholder="192.168.1.1"
              class="filter-input"
          />
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 12px; color: #888; margin-bottom: 5px; display: block;">
            Поиск по странице
          </label>
          <input
              type="text"
              v-model="analyticsFilters.url"
              placeholder="/page или название"
              class="filter-input"
          />
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 12px; color: #888; margin-bottom: 5px; display: block;">
            Поиск по источнику
          </label>
          <input
              type="text"
              v-model="analyticsFilters.referer"
              placeholder="google.com, yandex.ru..."
              class="filter-input"
          />
        </div>
        <div class="form-group" style="margin: 0;">
          <label style="font-size: 12px; color: #888; margin-bottom: 5px; display: block;">
            Фильтр по дате
          </label>
          <input
              type="date"
              v-model="analyticsFilters.date"
              class="filter-input"
          />
        </div>
      </div>
      <div style="margin-top: 15px; display: flex; gap: 10px; align-items: center;">
        <button @click="clearAnalyticsFilters" class="btn btn-secondary" style="padding: 8px 16px;">
          <i class="fas fa-times"></i> Сбросить фильтры
        </button>
        <span style="color: #888; font-size: 12px;">
          Найдено: {{ filteredRecentVisits.length }} из {{ analyticsData?.recent_visits?.length || 0 }} посещений
        </span>
      </div>
    </div>

    <div v-if="analyticsError" class="error-message">
      {{ analyticsError }}
    </div>

    <div v-if="analyticsLoading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Загрузка аналитики...</p>
    </div>

    <div v-else-if="analyticsData" class="analytics-dashboard">

      <!-- Stats -->
      <div class="analytics-stats">
        <div class="stat-card">
          <div class="stat-icon" style="background: #3498db;">
            <i class="fas fa-eye"></i>
          </div>
          <div class="stat-content">
            <h3>{{ analyticsData.total_visits }}</h3>
            <p>Всего посещений</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #2ecc71;">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-content">
            <h3>{{ analyticsData.unique_visitors }}</h3>
            <p>Уникальных посетителей</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: #e74c3c;">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>{{ analyticsData.period_days }}</h3>
            <p>Дней в периоде</p>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="analytics-charts">
        <div class="chart-card">
          <h3>Посещения по дням</h3>
          <div class="chart-container">
            <canvas ref="dailyChart" style="max-height: 300px;"></canvas>
          </div>
        </div>
        <div class="chart-card">
          <h3>Посещения по часам</h3>
          <div class="chart-container">
            <canvas ref="hourlyChart" style="max-height: 300px;"></canvas>
          </div>
        </div>
      </div>

      <!-- Tables -->
      <div class="analytics-tables">

        <!-- Top pages -->
        <div class="table-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0;">Топ страниц (все)</h3>
            <div style="flex: 1; max-width: 300px; margin-left: 15px;">
              <input
                  type="text"
                  v-model="analyticsFilters.topPagesSearch"
                  placeholder="Поиск по странице..."
                  class="filter-input"
              />
            </div>
          </div>
          <div class="table-responsive">
            <table class="analytics-table" ref="topPagesTable">
              <thead>
              <tr>
                <th data-column="analytics_top_page_url">Страница<div class="column-resize-handle"></div></th>
                <th data-column="analytics_top_page_count">Посещений<div class="column-resize-handle"></div></th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="page in filteredTopPages" :key="page.url">
                <td>
                    <span
                        v-if="page.is_virtual"
                        style="color: #2ecc71; margin-right: 5px;"
                        title="Виртуальная страница"
                    >
                      <i class="fas fa-file-alt"></i>
                    </span>
                  {{ getProductName(page.url) }}
                </td>
                <td><strong>{{ page.count }}</strong></td>
              </tr>
              <tr v-if="filteredTopPages.length === 0">
                <td colspan="2" style="text-align: center; color: #888;">
                  {{ analyticsFilters.topPagesSearch ? 'Ничего не найдено' : 'Нет данных' }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent visits -->
        <div class="table-card">
          <h3>Последние посещения</h3>
          <div class="table-responsive">
            <table class="analytics-table" ref="recentVisitsTable">
              <thead>
              <tr>
                <th data-column="analytics_visit_date">Дата<div class="column-resize-handle"></div></th>
                <th data-column="analytics_visit_time">Время<div class="column-resize-handle"></div></th>
                <th data-column="analytics_visit_ip">IP адрес<div class="column-resize-handle"></div></th>
                <th data-column="analytics_visit_url">Страница<div class="column-resize-handle"></div></th>
                <th data-column="analytics_visit_referer">Источник<div class="column-resize-handle"></div></th>
              </tr>
              </thead>
              <tbody>
              <tr
                  v-for="visit in filteredRecentVisits"
                  :key="visit.date + visit.time + visit.ip"
              >
                <td>{{ visit.date }}</td>
                <td>{{ visit.time }}</td>
                <td>{{ visit.ip }}</td>
                <td>{{ visit.url === '/' ? 'Домашняя' : visit.url }}</td>
                <td>{{ visit.referer || '-' }}</td>
              </tr>
              <tr v-if="filteredRecentVisits.length === 0">
                <td colspan="5" style="text-align: center; color: #888;">
                  {{ hasActiveFilters ? 'Ничего не найдено' : 'Нет данных' }}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-input {
  width: 100%;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
}

.analytics-dashboard {
  padding: 20px;
}

.analytics-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--background-secondary);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 24px;
}

.stat-content h3 { font-size: 32px; margin: 0; color: var(--text-primary); }
.stat-content p { margin: 5px 0 0 0; color: #aaa; font-size: 14px; }

.analytics-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: var(--background-secondary);
  border-radius: 8px;
  padding: 20px;
}

.chart-card h3 { margin: 0 0 20px 0; color: var(--text-primary); }
.chart-container { height: 300px; position: relative; }

.analytics-tables {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.table-card {
  background: var(--background-secondary);
  border-radius: 8px;
  padding: 20px;
}

.table-card h3 { margin: 0 0 20px 0; color: var(--text-primary); }
.table-responsive { overflow-x: auto; }

.analytics-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

.analytics-table th {
  background: var(--background-secondary);
  color: var(--text-primary);
  padding: 12px;
  text-align: left;
  font-weight: 600;
  position: relative;
  user-select: none;
}

.analytics-table th:not(:last-child) {
  border-right: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.analytics-table th:not(:last-child):hover {
  border-right-color: var(--border-strong);
}

.analytics-table .column-resize-handle {
  position: absolute;
  top: 0;
  right: -2px;
  width: 4px;
  height: 100%;
  background: transparent;
  cursor: col-resize;
  z-index: 20;
  transition: background-color 0.3s ease;
}

.analytics-table .column-resize-handle:hover { background: var(--background-additional); }
.analytics-table .column-resize-handle.active { background: var(--background-additional); box-shadow: 0 0 10px var(--shadow-primary); }
.analytics-table .column-resize-handle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 20px;
  background: var(--background-secondary);
  border-radius: 1px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.analytics-table .column-resize-handle:hover::before { opacity: 1; }
.analytics-table .column-resize-handle.active::before { background: var(--background-additional); opacity: 1; }

.analytics-table td {
  padding: 12px;
  border-top: 1px solid var(--background);
  color: var(--text-additional-light);
  user-select: text;
}

.analytics-table tr:hover {
  background: var(--hover-table);
}

.resize-indicator {
  position: fixed;
  top: 0;
  left: 0;
  width: 2px;
  height: 100vh;
  background: var(--primary);
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.resize-indicator.active {
  opacity: 1;
}
</style>