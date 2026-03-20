NV.ready(function registerAnalyticsComponent() {
    if (!NV.admin) {
        setTimeout(registerAnalyticsComponent, 10);
        return;
    }
    NV.admin.component('analytics-view', {
    template: '#analytics-template',
    computed: {
        analyticsData() {
            return this.$root.analyticsData;
        },
        analyticsLoading() {
            return this.$root.analyticsLoading;
        },
        analyticsError() {
            return this.$root.analyticsError;
        },
        analyticsPeriod: {
            get() {
                return this.$root.analyticsPeriod;
            },
            set(value) {
                this.$root.analyticsPeriod = value;
            }
        },
        analyticsFilters() {
            return this.$root.analyticsFilters;
        },
        filteredRecentVisits() {
            return this.$root.filteredRecentVisits;
        },
        filteredTopPages() {
            return this.$root.filteredTopPages;
        },
        filteredTopPhpPages() {
            return this.$root.filteredTopPhpPages;
        }
    },
    methods: {
        async loadAnalytics() {
            this.$root.analyticsLoading = true;
            this.$root.analyticsError = '';

            try {
                const response = await fetch(`../api.php?action=analytics&period=${this.$root.analyticsPeriod}`, { credentials: 'same-origin' });
                if (response.ok) {
                    this.$root.analyticsData = await response.json();
                    this.$nextTick(() => {
                        this.renderCharts();
                        this.initAnalyticsColumnResize();
                    });
                } else {
                    this.$root.analyticsError = 'Ошибка загрузки аналитики';
                }
            } catch (error) {
                console.error('Error loading analytics:', error);
                this.$root.analyticsError = 'Ошибка загрузки аналитики';
            }

            this.$root.analyticsLoading = false;
        },
        clearAnalyticsFilters() {
            this.$root.analyticsFilters = {
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
                    const topPagesTable = this.$refs.topPagesTable;

                    if (topPagesTable) {
                        const handles = topPagesTable.querySelectorAll('.column-resize-handle');

                        handles.forEach(handle => {
                            const newHandle = handle.cloneNode(true);
                            handle.parentNode.replaceChild(newHandle, handle);
                            this.setupAnalyticsColumnResize(newHandle, 'analytics_top');
                        });

                        this.loadAnalyticsColumnWidths('analytics_top', topPagesTable);
                    }

                    const topPhpPagesTable = this.$refs.topPhpPagesTable;

                    if (topPhpPagesTable) {
                        const handles = topPhpPagesTable.querySelectorAll('.column-resize-handle');

                        handles.forEach(handle => {
                            const newHandle = handle.cloneNode(true);
                            handle.parentNode.replaceChild(newHandle, handle);
                            this.setupAnalyticsColumnResize(newHandle, 'analytics_php');

                        });
                        this.loadAnalyticsColumnWidths('analytics_php', topPhpPagesTable);
                    }

                    const recentVisitsTable = this.$refs.recentVisitsTable;

                    if (recentVisitsTable) {
                        const handles = recentVisitsTable.querySelectorAll('.column-resize-handle');

                        handles.forEach(handle => {
                            const newHandle = handle.cloneNode(true);
                            handle.parentNode.replaceChild(newHandle, handle);
                            this.setupAnalyticsColumnResize(newHandle, 'analytics_visit');
                        });

                        this.loadAnalyticsColumnWidths('analytics_visit', recentVisitsTable);
                    }
                }, 100);
            });
        },
        setupAnalyticsColumnResize(handle, prefix) {
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

                    const rows = table.querySelectorAll('tbody tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td');
                        if (cells[columnIndex]) {
                            cells[columnIndex].style.width = newWidth + 'px';
                            cells[columnIndex].style.minWidth = newWidth + 'px';
                        }
                    });

                    const columnName = column.dataset.column;
                    this.saveAnalyticsColumnWidth(columnName, newWidth);

                    isResizing = false;
                    handle.classList.remove('active');

                    if (indicator) {
                        indicator.classList.remove('active');
                        setTimeout(() => {
                            if (indicator && indicator.parentNode) {
                                indicator.parentNode.removeChild(indicator);
                            }
                        }, 200);
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
            const savedWidths = JSON.parse(localStorage.getItem('admin_analytics_column_widths') || '{}');
            savedWidths[columnName] = width;
            localStorage.setItem('admin_analytics_column_widths', JSON.stringify(savedWidths));
        },
        loadAnalyticsColumnWidths(prefix, table) {
            const savedWidths = JSON.parse(localStorage.getItem('admin_analytics_column_widths') || '{}');
            if (!table) return;

            Object.keys(savedWidths).forEach(columnName => {
                if (columnName.startsWith(prefix)) {
                    const column = table.querySelector(`th[data-column="${columnName}"]`);

                    if (column) {
                        const width = savedWidths[columnName] + 'px';
                        column.style.width = width;
                        column.style.minWidth = width;

                        const headerRow = table.querySelector('thead tr');
                        const columnIndex = Array.from(headerRow.children).indexOf(column);

                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach(row => {
                            const cells = row.querySelectorAll('td');

                            if (cells[columnIndex]) {
                                cells[columnIndex].style.width = width;
                                cells[columnIndex].style.minWidth = width;
                            }
                        });
                    }
                }
            });
        },
        renderCharts() {
            if (!this.$root.analyticsData) return;

            if (this.$root.dailyChart) {
                this.$root.dailyChart.destroy();
            }

            if (this.$root.hourlyChart) {
                this.$root.hourlyChart.destroy();
            }

            const dailyCtx = this.$refs.dailyChart;

            if (dailyCtx) {
                const dailyLabels = this.$root.analyticsData.daily_visits.map(v => {
                    const date = new Date(v.date);
                    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
                });

                const dailyData = this.$root.analyticsData.daily_visits.map(v => v.count);

                this.$root.dailyChart = new Chart(dailyCtx, {
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
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }

            const hourlyCtx = this.$refs.hourlyChart;

            if (hourlyCtx) {
                const hourlyLabels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
                const hourlyData = Array.from({ length: 24 }, (_, i) => {
                    const hourData = this.$root.analyticsData.hourly_visits.find(h => h.hour === i);
                    return hourData ? hourData.count : 0;
                });

                this.$root.hourlyChart = new Chart(hourlyCtx, {
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
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }
        },
        getProductName(url) {
            if (typeof this.$root.getProductName === 'function') {
                return this.$root.getProductName(url);
            }
            return url;
        }
    }
    });
});