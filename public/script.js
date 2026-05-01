let currentTheme = 'light';
let allTables = [];
let router = null;
let isDataLoaded = false;
let pendingRoute = null;
let currentTable = null;

const API_URL = '/api';

class Router {
    constructor() {
        this.routes = {
            '/': () => this.showHome(),
            '/table/:name': (params) => this.showTable(params.name)
        };

        window.addEventListener('popstate', () => this.handleRoute());
    }

    async handleRoute() {
        if (!isDataLoaded) {
            pendingRoute = window.location.pathname;
            return;
        }

        const path = window.location.pathname;

        if (path === '/' || path === '') {
            this.routes['/']();
        } else if (path.startsWith('/table/')) {
            const tableName = decodeURIComponent(path.substring(7));
            const table = allTables.find(t => t.name === tableName);
            if (table) {
                this.routes['/table/:name']({ name: tableName });
            } else {
                this.routes['/']();
            }
        } else {
            this.routes['/']();
        }
    }

    navigateTo(url) {
        window.history.pushState({}, '', url);
        this.handleRoute();
    }

    showHome() {
        currentTable = null;
        showWelcomeScreen();
        this.updateActiveNav(null);
    }

    showTable(tableName) {
        const table = allTables.find(t => t.name === tableName);
        if (!table) {
            this.showHome();
            return;
        }

        currentTable = tableName;
        const html = renderTableDocumentation(table);

        const contentContainer = document.getElementById('contentContainer');
        if (contentContainer) {
            contentContainer.innerHTML = html;
        }

        this.updateActiveNav(tableName);
        attachFKHandlers();
    }

    updateActiveNav(tableName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            const itemTable = item.getAttribute('data-table');
            if (itemTable === tableName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', currentTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            currentTheme = 'dark';
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }

    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    initEventListeners();
    initSidebarResizer();
    await loadTablesData();

    isDataLoaded = true;
    router = new Router();

    if (pendingRoute && pendingRoute !== '/') {
        await router.handleRoute();
    } else {
        await router.handleRoute();
    }

    renderSidebar();
});

async function loadTablesData() {
    try {
        const response = await fetch(`${API_URL}/tables`);
        const result = await response.json();

        if (result.success && result.data) {
            allTables = Object.keys(result.data).map(key => ({
                name: key,
                title: result.data[key].title,
                data: result.data[key]
            }));

            allTables.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            throw new Error(result.error || 'Некорректный ответ от сервера');
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        const contentContainer = document.getElementById('contentContainer');
        if (contentContainer) {
            contentContainer.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h2>Ошибка загрузки данных</h2><p>${error.message}</p><p>Проверьте, что файл database.json находится в папке data/</p></div>`;
        }
    }
}

function initSidebarResizer() {
    const resizer = document.getElementById('sidebarResizer');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    if (!resizer || !sidebar) return;

    let startX, startWidth;
    let isResizing = false;


    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
        const width = parseInt(savedWidth);
        if (width >= 180 && width <= 500) {
            document.documentElement.style.setProperty('--sidebar-width', width + 'px');
            resizer.style.left = width + 'px';
            if (mainContent) {
                mainContent.style.marginLeft = width + 'px';
            }
        }
    }

    const startResize = (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(getComputedStyle(sidebar).width);
        resizer.classList.add('active');
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        e.preventDefault();
    };

    const doResize = (e) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        let newWidth = startWidth + deltaX;


        const minWidth = 180;
        const maxWidth = 500;
        newWidth = Math.min(maxWidth, Math.max(minWidth, newWidth));

        if (newWidth !== startWidth) {
            document.documentElement.style.setProperty('--sidebar-width', newWidth + 'px');
            resizer.style.left = newWidth + 'px';
            if (mainContent) {
                mainContent.style.marginLeft = newWidth + 'px';
            }
        }
    };

    const stopResize = () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';


            const newWidth = parseInt(getComputedStyle(sidebar).width);
            localStorage.setItem('sidebarWidth', newWidth);
        }
    };

    resizer.addEventListener('mousedown', startResize);
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
}

function initEventListeners() {
    const searchInput = document.getElementById('tableSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterTables(e.target.value);
        });
    }


    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }


    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', () => {
            if (router) {
                router.navigateTo('/');
            }
        });
    }

    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menuToggle');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (sidebar && menuToggle && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);

    localStorage.setItem('theme', currentTheme);

    const themeIcon = document.querySelector('#themeToggle i');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function filterTables(searchTerm) {
    const filtered = allTables.filter(table =>
        table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (table.title && table.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    renderSidebar(filtered);
}

function renderSidebar(tables = null) {
    const sidebarNav = document.getElementById('sidebarNav');
    if (!sidebarNav) return;

    const tablesToRender = tables || allTables;

    const grouped = {};
    tablesToRender.forEach(table => {
        const firstLetter = table.name[0];
        if (!grouped[firstLetter]) grouped[firstLetter] = [];
        grouped[firstLetter].push(table);
    });

    let html = '';
    const letters = Object.keys(grouped).sort();

    letters.forEach(letter => {
        html += `<div class="nav-category">${letter}</div>`;
        grouped[letter].forEach(table => {
            html += `
                <div class="nav-item" data-table="${escapeHtml(table.name)}">
                    <i class="fas fa-table"></i>
                    <span>${escapeHtml(table.title || table.name)}</span>
                    <span class="table-name">${escapeHtml(table.name)}</span>
                </div>
            `;
        });
    });

    sidebarNav.innerHTML = html;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const tableName = item.getAttribute('data-table');
            if (router) {
                router.navigateTo(`/table/${encodeURIComponent(tableName)}`);
            }
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('open');
            }
        });
    });
}

function attachFKHandlers() {
    document.querySelectorAll('.fk-link').forEach(link => {
        const newLink = link.cloneNode(true);
        link.parentNode.replaceChild(newLink, link);

        newLink.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTable = newLink.getAttribute('data-table');
            if (targetTable && router) {
                router.navigateTo(`/table/${encodeURIComponent(targetTable)}`);
            }
        });
    });
}

function renderTableDocumentation(table) {
    if (!table || !table.data) {
        return '<div class="empty-state">Ошибка: данные таблицы не загружены</div>';
    }

    const data = table.data;
    const columns = data.columns || [];
    const oneToMany = data.oneToMany || [];

    return `
        <div class="table-doc">
            <div class="table-header">
                <h2>${escapeHtml(data.title || table.name)}</h2>
                <div class="table-name">Таблица <code>${escapeHtml(table.name)}</code></div>
            </div>
            
            <div class="table-section">
                <h3><i class="fas fa-columns"></i> Структура колонок</h3>
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Название колонки в БД</th>
                                <th>Тип</th>
                                <th>Not Null</th>
                                <th>FK Constraint</th>
                                <th>Описание</th>
                                <th>Check Constraint</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${columns.length > 0 ? columns.map(col => `
                                <tr>
                                    <td><code>${escapeHtml(col.name)}</code></td>
                                    <td>${escapeHtml(col.type)}</td>
                                    <td>${col.notNull ? '<span class="constraint-badge" style="background:#10b981">Да</span>' : '<span style="color:var(--text-secondary)">Нет</span>'}</td>
                                    <td>${col.fk ? `<a href="#" class="fk-link" data-table="${escapeHtml(col.fk)}">→ ${escapeHtml(col.fk)}</a>` : '—'}</td>
                                    <td>${escapeHtml(col.description) || '—'}</td>
                                    <td>${col.check ? `<code style="font-size:0.7rem">${escapeHtml(col.check)}</code>` : '—'}</td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="6" style="text-align:center; color:var(--text-secondary); padding:1.5rem;">
                                        Нет данных о колонках
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
            
            ${oneToMany.length > 0 ? `
                <div class="table-section">
                    <h3><i class="fas fa-link"></i> Связи (OneToMany)</h3>
                    <div style="overflow-x: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Таблица</th>
                                    <th>Колонка для связи</th>
                                    <th>Описание связи</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${oneToMany.map(rel => `
                                    <tr>
                                        <td><a href="#" class="fk-link" data-table="${escapeHtml(rel.table)}">${escapeHtml(rel.table)}</a></td>
                                        <td><code>${escapeHtml(rel.column)}</code></td>
                                        <td>${escapeHtml(rel.description) || '—'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function showWelcomeScreen() {
    const html = `
        <div class="empty-state">
            <i class="fas fa-database"></i>
            <h2>Добро пожаловать в документацию БД</h2>
            <p>Выберите таблицу из меню слева для просмотра детальной информации</p>
            <div class="empty-state-stats">
                <div class="empty-state-stat">
                    <i class="fas fa-table"></i>
                    <span>Всего таблиц: <strong>${allTables.length || 0}</strong></span>
                </div>
                <div class="empty-state-stat">
                    <i class="fas fa-share-alt"></i>
                    <span>Поделиться ссылкой: <code>/table/НАЗВАНИЕ_ТАБЛИЦЫ</code></span>
                </div>
            </div>
        </div>
    `;

    const contentContainer = document.getElementById('contentContainer');
    if (contentContainer) {
        contentContainer.innerHTML = html;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}