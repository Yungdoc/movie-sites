document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const menuOverlay = document.getElementById('menuOverlay');
    const closeX = document.getElementById('closeX');

    // Theme toggle (light / dark) - injects a button into the navbar and persists choice in localStorage
    const themeToggleId = 'themeToggle';
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateThemeIcon(theme);
    }
    function updateThemeIcon(theme) {
        const btn = document.getElementById(themeToggleId);
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (!icon) return;
        if (theme === 'light') {
            icon.className = 'fas fa-sun';
            btn.setAttribute('aria-label','Switch to dark mode');
            btn.title = 'Switch to dark mode';
        } else {
            icon.className = 'fas fa-moon';
            btn.setAttribute('aria-label','Switch to light mode');
            btn.title = 'Switch to light mode';
        }
    }
    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        setTheme(current === 'dark' ? 'light' : 'dark');
    }
    function createThemeToggle() {
        if (document.getElementById(themeToggleId)) return;
        const btn = document.createElement('button');
        btn.id = themeToggleId;
        btn.className = 'theme-toggle';
        btn.type = 'button';
        btn.innerHTML = '<i class="fas fa-moon"></i>';
        btn.addEventListener('click', toggleTheme);
        // try to place it after the search bar if present otherwise append to navbar
        const srch = document.querySelector('.srch-bar');
        if (srch && srch.parentNode) srch.parentNode.insertBefore(btn, srch.nextSibling);
        else {
            const nav = document.querySelector('.navbar');
            if (nav) nav.appendChild(btn);
        }
    }
    function initTheme() {
        createThemeToggle();
        const saved = localStorage.getItem('theme');
        if (saved) setTheme(saved);
        else {
            const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
            setTheme(prefersLight ? 'light' : 'dark');
        }
    }
    // initialize theme UI
    initTheme();

    if (hamburger && menuOverlay) {
        hamburger.addEventListener('click', () => {
            // populate mobile menu with movie list before showing
            populateMobileMenu();
            // auto-expand the first genre for easier access on mobile
            const firstHeader = document.querySelector('#mobileMenu .mobile-genre-header');
            if (firstHeader) firstHeader.click();
            menuOverlay.classList.add('active');
        });
    }

    // --- Make the image slider rotate continuously without pausing/jumping ---
    function setupContinuousSlider() {
        const wrapper = document.querySelector('.slider-wrapper');
        if (!wrapper) return;

        const imgs = Array.from(wrapper.querySelectorAll('img'));
        if (imgs.length < 2) return; // nothing to rotate

        // If we already set up, skip
        if (wrapper.dataset.continuous === 'true') return;

        // Clone the first image and append it to create a seamless loop
        const firstClone = imgs[0].cloneNode(true);
        wrapper.appendChild(firstClone);

        const slideCount = imgs.length + 1; // including clone

        // Adjust wrapper width and each image flex-basis so slides are equal
        wrapper.style.width = (slideCount * 100) + '%';
        Array.from(wrapper.querySelectorAll('img')).forEach(img => {
            img.style.width = (100 / slideCount) + '%';
            img.style.flex = '0 0 ' + (100 / slideCount) + '%';
            img.style.display = 'block';
        });

        // Create a unique keyframe to animate from 0 to -100*(slideCount-1)/slideCount percent
        const percent = ((slideCount - 1) / slideCount) * 100;
        const durationPerSlide = 4; // seconds per slide appearance
        const totalDuration = Math.max(12, Math.round(slideCount * durationPerSlide));
        const animName = 'slide_continuous_' + Date.now();

        const styleTag = document.createElement('style');
        styleTag.type = 'text/css';
        styleTag.textContent = `@keyframes ${animName} { 0% { transform: translateX(0); } 100% { transform: translateX(-${percent}%); } }`;
        document.head.appendChild(styleTag);

        // Apply animation inline so it takes precedence and is linear and infinite
        wrapper.style.animation = `${animName} ${totalDuration}s linear infinite`;
        wrapper.dataset.continuous = 'true';
    }

    // Ensure slider animation stays running continuously
    function ensureContinuousPlaying() {
        const wrapper = document.querySelector('.slider-wrapper');
        if (!wrapper) return;

        // Force running state
        const ensureRunning = () => {
            try {
                wrapper.style.animationPlayState = 'running';
            } catch (e) { /* ignore */ }
        };

        // Set it initially
        ensureRunning();

        // Resume on page visibility / focus events
        document.addEventListener('visibilitychange', () => { if (!document.hidden) ensureRunning(); });
        window.addEventListener('focus', ensureRunning);

        // Resume on pointer interactions (mobile touchstart / mouseenter)
        wrapper.addEventListener('touchstart', ensureRunning, {passive:true});
        wrapper.addEventListener('mouseenter', ensureRunning);

        // Periodically ensure it remains running (defensive; interval is small to avoid overhead)
        const iv = setInterval(() => { ensureRunning(); }, 5000);
        // store interval id so it could be cleared if needed
        wrapper.dataset._resumeInterval = iv;
    }

    if (closeX && menuOverlay) {
        closeX.addEventListener('click', () => {
            menuOverlay.classList.remove('active');
        });

        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('active');
            }
        });
    }

    // --- Search & Filter functionality for index.html ---
    // escape for use inside RegExp
    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Ensure every title element keeps original text in data-original-title
    function initTitleData() {
        document.querySelectorAll('.show-list h3').forEach(h3 => {
            if (!h3.dataset.originalTitle) {
                h3.dataset.originalTitle = h3.textContent.trim();
            }
        });
    }

    function clearHighlights() {
        document.querySelectorAll('.show-list h3').forEach(h3 => {
            if (h3.dataset.originalTitle) h3.textContent = h3.dataset.originalTitle;
        });
    }

    function highlightTitle(h3, query) {
        if (!h3 || !h3.dataset.originalTitle) return;
        const original = h3.dataset.originalTitle;
        if (!query) {
            h3.textContent = original;
            return;
        }
        try {
            const re = new RegExp('(' + escapeRegExp(query) + ')', 'ig');
            h3.innerHTML = original.replace(re, '<mark>$1</mark>');
        } catch (e) {
            h3.textContent = original;
        }
    }

    function filterByQuery(query) {
        query = (query || '').trim();
        const qLower = query.toLowerCase();
        const sections = document.querySelectorAll('.show-section');

        initTitleData();

        sections.forEach(section => {
            const showList = section.querySelector('.show-list');
            const items = Array.from(section.querySelectorAll('.show-item'));
            let anyVisible = false;

            items.forEach(item => {
                const titleEl = item.querySelector('h3');
                const title = (titleEl && titleEl.dataset && titleEl.dataset.originalTitle) ? titleEl.dataset.originalTitle.toLowerCase() : (titleEl ? titleEl.textContent.toLowerCase() : item.textContent.toLowerCase() || '');
                const genre = (showList && showList.dataset && showList.dataset.genre) ? showList.dataset.genre.toLowerCase() : (section.className || '').toLowerCase();
                const matchesQuery = query === '' || title.indexOf(qLower) !== -1 || genre.indexOf(qLower) !== -1;
                item.style.display = matchesQuery ? '' : 'none';
                if (matchesQuery) {
                    anyVisible = true;
                    // highlight matched text in title when query non-empty
                    if (titleEl) highlightTitle(titleEl, qLower);
                } else {
                    // reset title if hidden
                    if (titleEl && titleEl.dataset && titleEl.dataset.originalTitle) titleEl.textContent = titleEl.dataset.originalTitle;
                }
            });

            // hide the whole section (header + list) if none of its items match
            section.style.display = anyVisible ? '' : 'none';
        });
    }

    function setupFilters() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const filterBar = document.getElementById('filterBar');

        if (searchInput) {
            // live search
            searchInput.addEventListener('input', (e) => {
                // clear active filter buttons when user types
                const filterBarEl = document.getElementById('filterBar');
                if (filterBarEl) filterBarEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                filterByQuery(e.target.value);
            });
        }

        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                const filterBarEl = document.getElementById('filterBar');
                if (filterBarEl) filterBarEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                filterByQuery(searchInput.value);
            });
        }

        if (filterBar) {
            filterBar.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (!btn) return;
                const genre = (btn.dataset.genre || '').toLowerCase();

                // toggle active state
                filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentGenre = genre;

                // apply genre filter in the unified grid
                const searchInput = document.getElementById('searchInput');
                filterByQuery(searchInput ? searchInput.value : '');
            });
        }

        // Clear button: reset search and filters
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const input = document.getElementById('searchInput');
                if (input) input.value = '';
                // remove active from filter buttons
                const fb = document.getElementById('filterBar');
                if (fb) fb.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                // reset origin and genre and show featured items
                currentOrigin = '';
                currentGenre = 'all';
                // clear active state on origin nav links (header + mobile)
                document.querySelectorAll('.nav-link a[data-origin], #mobileMenu a[data-origin]').forEach(a => a.classList.remove('active'));
                        // show featured in all-list
                        document.querySelectorAll('.all-list .show-item').forEach(i => {
                            if (i.dataset.featured === 'true') i.style.display = '';
                            else i.style.display = 'none';
                        });
                // remove highlights
                clearHighlights();
                // focus back to input
                if (input) input.focus();
            });
        }
    }

    // --- Comments injection for detail pages (no need to edit every HTML file) ---
    function injectComments() {
        const container = document.querySelector('.movie-detail-container');
        if (!container) return; // not on a detail page

        // avoid double-inject
        if (document.getElementById('comments-section')) return;

        const commentsSection = document.createElement('section');
        commentsSection.id = 'comments-section';
        commentsSection.className = 'comments-section';

        const title = document.createElement('h3');
        title.textContent = 'User Reviews & Comments';

        const list = document.createElement('div');
        list.id = 'comments-list';
        list.className = 'comments-list';

        const form = document.createElement('form');
        form.id = 'comment-form';

        const textarea = document.createElement('textarea');
        textarea.id = 'comment-input';
        textarea.placeholder = 'Write a review or comment...';
        textarea.required = true;

        const nameInput = document.createElement('input');
        nameInput.id = 'comment-name';
        nameInput.type = 'text';
        nameInput.placeholder = 'Your name (optional)';

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.className = 'comment-submit';
        submit.textContent = 'Post Comment';

        form.appendChild(nameInput);
        form.appendChild(textarea);
        form.appendChild(submit);

        commentsSection.appendChild(title);
        commentsSection.appendChild(list);
        commentsSection.appendChild(form);

        // append after movie header
        container.appendChild(commentsSection);

        const storageKey = 'comments:' + window.location.pathname;

        function loadComments() {
            const raw = localStorage.getItem(storageKey);
            let arr = [];
            try { arr = raw ? JSON.parse(raw) : []; } catch (e) { arr = []; }
            list.innerHTML = '';
            if (arr.length === 0) {
                const p = document.createElement('p');
                p.className = 'no-comments';
                p.textContent = 'No comments yet — be the first to review!';
                list.appendChild(p);
                return;
            }
            arr.forEach(c => {
                const div = document.createElement('div');
                div.className = 'comment';
                const who = document.createElement('strong');
                who.textContent = c.name ? c.name : 'Anonymous';
                const when = document.createElement('span');
                when.className = 'comment-time';
                when.textContent = ' — ' + new Date(c.time).toLocaleString();
                const msg = document.createElement('p');
                msg.textContent = c.text;
                div.appendChild(who);
                div.appendChild(when);
                div.appendChild(msg);
                list.appendChild(div);
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = textarea.value.trim();
            const name = nameInput.value.trim();
            if (!text) return;
            const raw = localStorage.getItem(storageKey);
            let arr = [];
            try { arr = raw ? JSON.parse(raw) : []; } catch (err) { arr = []; }
            arr.unshift({ name: name, text: text, time: Date.now() });
            localStorage.setItem(storageKey, JSON.stringify(arr));
            textarea.value = '';
            nameInput.value = '';
            loadComments();
        });

        // initial load
        loadComments();
    }

        // --- Setup video player and downloadable links on detail pages ---
        function setupMovieDetailMedia() {
            const container = document.querySelector('.movie-detail-container');
            if (!container) return;

            const downloadAnchor = container.querySelector('.download-section a.download-btn');
            const infoP = container.querySelector('.download-section p');

            // determine a sensible default file URL if none provided
            let fileUrl = downloadAnchor ? downloadAnchor.getAttribute('href') : null;
            if (!fileUrl) {
                const filename = window.location.pathname.split('/').pop() || '';
                const slug = filename.replace(/\.html?$/i, '').trim().replace(/\s+/g, '_').toLowerCase();
                fileUrl = 'media/' + slug + '.mp4'; // convention: put media files under /media/<slug>.mp4
                if (downloadAnchor) downloadAnchor.setAttribute('href', fileUrl);
            }

            // insert a video player above the download section for preview/streaming
            if (fileUrl) {
                const dlSection = container.querySelector('.download-section');
                if (dlSection) {
                    const videoWrap = document.createElement('div');
                    videoWrap.className = 'detail-video-wrap';
                    const video = document.createElement('video');
                    video.controls = true;
                    video.preload = 'metadata';
                    video.className = 'detail-video';
                    const src = document.createElement('source');
                    src.src = fileUrl;
                    src.type = 'video/mp4';
                    video.appendChild(src);
                    videoWrap.appendChild(video);
                    dlSection.parentNode.insertBefore(videoWrap, dlSection);
                }

                // try a HEAD request to get file size (requires CORS on remote host)
                fetch(fileUrl, { method: 'HEAD' }).then(resp => {
                    if (resp.ok) {
                        const len = resp.headers.get('content-length');
                        if (len && infoP) {
                            const sizeMB = (parseInt(len, 10) / (1024 * 1024)).toFixed(2);
                            infoP.textContent = '\u24D8 File size: ~' + sizeMB + ' MB | Format: MP4';
                        }
                        // if server does not force download, the anchor download attribute may be ignored when cross-origin
                        if (downloadAnchor) {
                            downloadAnchor.setAttribute('href', fileUrl);
                            downloadAnchor.setAttribute('download', '');
                        }
                    }
                }).catch(() => {
                    // HEAD may fail due to CORS; silently ignore and leave link as-is
                    if (infoP && infoP.textContent.indexOf('File size') === -1) infoP.textContent = '\u24D8 File size: Unknown | Format: MP4';
                });
            }
        }

    // --- Mobile menu population: include movie selection list ---
    function populateMobileMenu() {
        // ensure filter bar placement/cloning is up-to-date for mobile
        relocateFilterBarForViewport && relocateFilterBarForViewport();
        const mobileMenu = document.getElementById('mobileMenu');
        if (!mobileMenu) return;

        // remove previous generated list to avoid duplicates
        const existing = mobileMenu.querySelector('.mobile-movie-list');
        if (existing) existing.remove();

        const listContainer = document.createElement('div');
        listContainer.className = 'mobile-movie-list';

        const heading = document.createElement('h3');
        heading.textContent = 'Movies';
        heading.style.marginTop = '12px';
        heading.style.marginBottom = '8px';
        heading.style.color = '#fff';
        listContainer.appendChild(heading);

        // gather all sections and group by genre
        const sections = document.querySelectorAll('.show-list');
        sections.forEach(section => {
            const genre = section.dataset.genre || '';

            // genre header container with chevron for collapse/expand
            const headerWrap = document.createElement('div');
            headerWrap.className = 'mobile-genre-header';
            headerWrap.setAttribute('role', 'button');
            headerWrap.setAttribute('tabindex', '0');
            headerWrap.setAttribute('aria-expanded', 'false');

            const gLabel = document.createElement('span');
            gLabel.className = 'mobile-genre-label';
            gLabel.textContent = genre ? genre.toUpperCase() : 'OTHER';

            const chev = document.createElement('span');
            chev.className = 'mobile-genre-chev';
            chev.innerHTML = '<i class="fas fa-chevron-right" aria-hidden="true"></i>';

            headerWrap.appendChild(gLabel);
            headerWrap.appendChild(chev);
            listContainer.appendChild(headerWrap);

            const ul = document.createElement('ul');
            ul.className = 'mobile-genre-list';
            ul.style.display = 'none'; // collapsed by default

            section.querySelectorAll('.show-item').forEach(item => {
                const a = item.querySelector('a');
                const titleEl = item.querySelector('h3');
                if (!a || !titleEl) return;
                const li = document.createElement('li');
                const link = document.createElement('a');
                link.href = a.getAttribute('href');
                link.textContent = titleEl.dataset && titleEl.dataset.originalTitle ? titleEl.dataset.originalTitle : titleEl.textContent;
                // when a link in mobile menu is clicked, close the overlay for better UX
                link.addEventListener('click', () => {
                    if (menuOverlay) menuOverlay.classList.remove('active');
                });
                li.appendChild(link);
                ul.appendChild(li);
            });

            listContainer.appendChild(ul);

            // add a mobile-friendly filter bar at the top of the mobile menu
            // remove existing mobile clone if any
            const existingMobileFilter = mobileMenu.querySelector('.mobile-filter-bar');
            if (existingMobileFilter) existingMobileFilter.remove();
            const filterBar = document.getElementById('filterBar');
            if (filterBar) {
                const mobileFilter = document.createElement('div');
                mobileFilter.className = 'mobile-filter-bar';

                // clone buttons (without copying ids)
                const btns = filterBar.querySelectorAll('.filter-btn');
                const mbtnWrap = document.createElement('div');
                mbtnWrap.className = 'mobile-filter-buttons';
                btns.forEach(b => {
                    const nb = document.createElement('button');
                    nb.className = 'filter-btn mobile-filter-btn';
                    nb.dataset.genre = b.dataset.genre;
                    nb.textContent = b.textContent;
                    mbtnWrap.appendChild(nb);
                });

                mobileFilter.appendChild(mbtnWrap);
                // insert mobile filter at top of menu (after heading)
                mobileMenu.insertBefore(mobileFilter, mobileMenu.querySelector('h3') ? mobileMenu.querySelector('h3').nextSibling : mobileMenu.firstChild);

                // wire up mobile filter buttons to behave like desktop: set active, set currentGenre, filter, and close menu
                mobileFilter.addEventListener('click', (e) => {
                    const btn = e.target.closest('.mobile-filter-btn');
                    if (!btn) return;
                    const genre = (btn.dataset.genre || '').toLowerCase();
                    // remove active from both desktop and mobile buttons
                    document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
                    mobileFilter.querySelectorAll('.mobile-filter-btn').forEach(x => x.classList.remove('active'));
                    // set active
                    btn.classList.add('active');
                    const desktopBtn = document.querySelector('.filter-btn[data-genre="' + genre + '"]');
                    if (desktopBtn) desktopBtn.classList.add('active');
                    currentGenre = genre;
                    const searchInput = document.getElementById('searchInput');
                    filterByQuery(searchInput ? searchInput.value : '');
                    // keep menu open per user preference (do not auto-close)
                    // previously we auto-closed the menu here; intentionally left blank
                });
            }

            // toggle behavior for headerWrap
            function toggleGenre(expand) {
                const isExpanded = headerWrap.getAttribute('aria-expanded') === 'true';
                const willExpand = typeof expand === 'boolean' ? expand : !isExpanded;
                headerWrap.setAttribute('aria-expanded', willExpand ? 'true' : 'false');

                const icon = headerWrap.querySelector('.mobile-genre-chev i');

                if (willExpand) {
                    // show and animate open
                    ul.style.display = 'block';
                    // force a reflow so transition starting point is correct
                    // eslint-disable-next-line no-unused-expressions
                    ul.offsetHeight;
                    ul.classList.add('open');
                    ul.style.maxHeight = ul.scrollHeight + 'px';
                    if (icon) icon.style.transform = 'rotate(90deg)';
                } else {
                    // animate closed
                    ul.style.maxHeight = '0px';
                    ul.classList.remove('open');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                    // after transition, hide the element to keep markup tidy
                    const onEnd = function (ev) {
                        if (ev.propertyName === 'max-height') {
                            ul.style.display = 'none';
                            ul.removeEventListener('transitionend', onEnd);
                        }
                    };
                    ul.addEventListener('transitionend', onEnd);
                }
            }

            headerWrap.addEventListener('click', () => toggleGenre());
            headerWrap.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleGenre(); }
            });
        });

        mobileMenu.appendChild(listContainer);
    }

    // --- Unified home grid & origin tagging ---
    // User-provided mapping for Nollyhood titles grouped by genre
    const nollyhoodMap = {
        comedy: ['igbudu','bad company','my settlement','the isakaba'],
        family: ['omugwo','family problem','family reunion','the family business'],
        christmas: ['christmas in miami'],
        drama: ['ukwa','the overheating','deceivers','open & close'],
        thriller: ['citation','the betrayed','the herd']
    };
    // Number of featured items shown on the All page by default. Change this value as needed.
    const FEATURED_LIMIT = 10;
    let currentGenre = 'all';

    function normalizeTitle(s){
        return (s||'').toString().toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    }

    let currentOrigin = ''; // '', 'hollywood', 'nollywood'

    function buildUnifiedGrid() {
        const allList = document.querySelector('.all-list');
        if (!allList) return;

        // gather all existing show items from per-genre lists
        const items = Array.from(document.querySelectorAll('.show-list')).reduce((acc, list) => {
            acc.push(...Array.from(list.querySelectorAll('.show-item')));
            return acc;
        }, []);

        // move unique items into all-list and tag origin
        const seen = new Set();
        items.forEach(item => {
            const titleEl = item.querySelector('h3');
            const anchor = item.querySelector('a');
            const title = titleEl ? normalizeTitle(titleEl.textContent) : '';
            if (!title || seen.has(title)) return;
            seen.add(title);

            // determine origin using the provided Nollyhood list; default to Hollywood
            let isNolly = false;
            for (const g in nollyhoodMap) {
                if (nollyhoodMap[g].includes(title)) { isNolly = true; break; }
            }
            const origin = isNolly ? 'nollywood' : 'hollywood';
            item.dataset.origin = origin;
            // preserve genre from original parent list if present
            const parentList = item.closest('.show-list');
            if (parentList && parentList.dataset && parentList.dataset.genre) {
                item.dataset.genre = parentList.dataset.genre;
            } else {
                item.dataset.genre = 'unknown';
            }

            // featured: keep first FEATURED_LIMIT visible on All page, hide the rest
            const idx = allList.querySelectorAll('.show-item').length;
            if (idx < FEATURED_LIMIT) {
                item.dataset.featured = 'true';
                item.style.display = '';
            } else {
                item.dataset.featured = 'false';
                item.style.display = 'none';
            }

            // no origin badge added

            // move item into all-list
            allList.appendChild(item);
        });

        // hide original per-genre sections to avoid duplicate content
        document.querySelectorAll('.show-section').forEach(section => {
            if (!section.classList.contains('all-section')) section.style.display = 'none';
        });
        // remove any leftover origin badges that might exist in HTML
        document.querySelectorAll('.origin-badge').forEach(b => b.remove());
        // ensure initial filter state (show featured)
        filterByQuery('');
    }

    // Populate the 'all-more.html' page with a full copy of the mixed list (all items)
    function populateMorePage() {
        const moreList = document.querySelector('.more-list');
        if (!moreList) return;
        // ensure the unified grid is built first
        const allList = document.querySelector('.all-list');
        if (!allList) return;

        // clone every show-item into the more-list and make sure they are visible
        moreList.innerHTML = '';
        Array.from(allList.querySelectorAll('.show-item')).forEach(item => {
            const clone = item.cloneNode(true);
            clone.style.display = '';
            // clear any data-featured flag to ensure all show up
            if (clone.dataset) clone.dataset.featured = 'true';
            moreList.appendChild(clone);
        });
    }

    function setOriginFilter(origin) {
        // toggle off if clicking same origin again
        if (currentOrigin === origin) origin = '';
        currentOrigin = origin || '';
        // update nav active state
        document.querySelectorAll('.nav-link a[data-origin], #mobileMenu a[data-origin]').forEach(a => {
            if ((a.dataset.origin || '') === origin) a.classList.add('active'); else a.classList.remove('active');
        });

        // apply filter over all-list items respecting search query
        const searchInput = document.getElementById('searchInput');
        filterByQuery(searchInput ? searchInput.value : '');
    }

    // augment filterByQuery to respect selected genre, origin and featured logic
    const prevFilterByQuery = filterByQuery;
    filterByQuery = function(query){
        query = (query||'').trim();
        const qLower = query.toLowerCase();
        const items = document.querySelectorAll('.all-list .show-item');
        let anyVisible = false;
        items.forEach(item => {
            const titleEl = item.querySelector('h3');
            const title = (titleEl && titleEl.dataset && titleEl.dataset.originalTitle) ? titleEl.dataset.originalTitle.toLowerCase() : (titleEl ? titleEl.textContent.toLowerCase() : item.textContent.toLowerCase() || '');
            const matchesQuery = query === '' || title.indexOf(qLower) !== -1;
            const matchesGenre = !currentGenre || currentGenre === 'all' || (item.dataset.genre === currentGenre);
            const matchesOrigin = !currentOrigin || (item.dataset.origin === currentOrigin);
            const isFeatured = item.dataset.featured === 'true';
            let show;
            // default: when genre is 'all' show only featured items (subject to search query)
            if (!currentGenre || currentGenre === 'all') {
                // if no origin filter is active, show only featured by default
                if (!currentOrigin) {
                    show = isFeatured && matchesQuery;
                } else {
                    // when origin is selected and genre is 'all', show all items matching origin
                    show = matchesQuery && matchesOrigin;
                }
            } else {
                // when a genre is selected, show matching genre items (and respect origin if set)
                show = matchesQuery && matchesGenre && matchesOrigin;
            }
            item.style.display = show ? '' : 'none';
            // highlight titles when shown
            if (show && titleEl) highlightTitle(titleEl, qLower);
            else if (titleEl && titleEl.dataset && titleEl.dataset.originalTitle) titleEl.textContent = titleEl.dataset.originalTitle;
            if (show) anyVisible = true;
        });

        // when nothing matches, show a friendly message in the all-section
        const allSection = document.querySelector('.all-section');
        if (allSection) {
            let emptyNote = allSection.querySelector('.no-results-note');
            if (!anyVisible) {
                if (!emptyNote) {
                    emptyNote = document.createElement('p');
                    emptyNote.className = 'no-results-note';
                    emptyNote.textContent = 'No movies match your selection.';
                    emptyNote.style.color = '#aaa';
                    emptyNote.style.marginTop = '12px';
                    allSection.appendChild(emptyNote);
                }
            } else {
                if (emptyNote) emptyNote.remove();
            }
        }
    };

    // origin filtering removed: no-op placeholder kept for backwards compatibility
    function setupOriginLinks() {
        // wire origin links in header and mobile menu so clicking filters by origin
        document.querySelectorAll('.nav-link a[data-origin], #mobileMenu a[data-origin]').forEach(a => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const origin = (a.dataset.origin || '').toLowerCase();
                setOriginFilter(origin);
            });
        });
    }

    // --- Relocate filter bar for viewport and clone into mobile menu when needed ---
    function relocateFilterBarForViewport() {
        const filterBar = document.getElementById('filterBar');
        const comedySection = document.querySelector('.comedy-section');
        const mobileMenu = document.getElementById('mobileMenu');
        if (!filterBar || !comedySection) return;

        if (window.innerWidth > 768) {
            // place filterBar as a separate block immediately after .top-container (so it appears visually below the slider)
            const topContainer = document.querySelector('.top-container');
            if (topContainer) {
                const insertAfter = topContainer.nextSibling;
                if (filterBar.parentNode !== topContainer.parentNode || filterBar !== insertAfter) {
                    topContainer.parentNode.insertBefore(filterBar, topContainer.nextSibling);
                }
            } else {
                // fallback: place filterBar right before the comedy section
                if (filterBar.parentNode !== comedySection.parentNode || filterBar.nextSibling !== comedySection) {
                    comedySection.parentNode.insertBefore(filterBar, comedySection);
                }
            }
            filterBar.style.display = '';
            // remove mobile clone if present
            if (mobileMenu) {
                const mobileClone = mobileMenu.querySelector('.mobile-filter-bar');
                if (mobileClone) mobileClone.remove();
            }
        } else {
            // mobile: hide the inline filterBar; do not clone it into the hamburger menu
            filterBar.style.display = 'none';
            // ensure no leftover cloned filter bar exists in mobile menu
            if (mobileMenu) {
                const mobileClone = mobileMenu.querySelector('.mobile-filter-bar');
                if (mobileClone) mobileClone.remove();
            }
        }
    }

    // --- Relocate search bar for mobile: move `.srch-bar` to just above the comedy section on small screens ---
    const _originalSearchParent = document.querySelector('.srch-bar') ? document.querySelector('.srch-bar').parentNode : null;
    function relocateSearchBarForViewport() {
        const searchBar = document.querySelector('.srch-bar');
        if (!searchBar) return;

        const comedySection = document.querySelector('.comedy-section');
        const navbar = document.querySelector('.navbar');

        if (window.innerWidth <= 768 && comedySection) {
            // if not already moved, insert before comedy section
            if (searchBar.parentNode !== comedySection.parentNode || searchBar.nextSibling !== comedySection) {
                comedySection.parentNode.insertBefore(searchBar, comedySection);
            }
        } else {
            // restore to navbar (place before hamburger if possible)
            if (navbar && searchBar.parentNode !== navbar) {
                const hamburgerEl = navbar.querySelector('#hamburger');
                if (hamburgerEl) navbar.insertBefore(searchBar, hamburgerEl);
                else navbar.appendChild(searchBar);
            }
        }
    }

    window.addEventListener('resize', () => { relocateSearchBarForViewport(); relocateFilterBarForViewport(); });
    // call once on load to position correctly
    relocateSearchBarForViewport();
    relocateFilterBarForViewport();

    // If we're on the 'more' page, populate it (shows full list)
    // If the URL contains ?view=more we'll reveal the full mixed list (not just the featured subset)
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'more') {
        // reveal all items in the unified grid
        document.querySelectorAll('.all-list .show-item').forEach(i => i.style.display = '');
        // clear any active filter button and visually mark 'All'
        const fb = document.getElementById('filterBar');
        if (fb) {
            fb.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            const allBtn = fb.querySelector('.filter-btn[data-genre="all"]');
            if (allBtn) allBtn.classList.add('active');
        }
        // when opening the 'more' view, scroll to the all-section
        const allSection = document.querySelector('.all-section');
        if (allSection) setTimeout(() => allSection.scrollIntoView({behavior: 'smooth'}), 80);
    }
    // also populate the /more page if present (fallback for all-more.html)
    populateMorePage();

    // Initialize on pages
    initTitleData();
    setupFilters();
    buildUnifiedGrid();
    setupOriginLinks();
    injectComments();
    setupMovieDetailMedia();
    setupContinuousSlider();
    ensureContinuousPlaying();

});