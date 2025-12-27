// Main JavaScript file
// Add any client-side functionality here

document.addEventListener('DOMContentLoaded', function() {
    // Auto-hide alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            alert.style.transition = 'opacity 0.5s';
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    });

    // Form validation enhancements
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#ef4444';
                } else {
                    field.style.borderColor = '';
                }
            });

            if (!isValid) {
                e.preventDefault();
                alert('Please fill in all required fields');
            }
        });
    });

    // Sidebar toggle functionality
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const sidebarToggleDesktop = document.getElementById('sidebar-toggle-desktop');
    const sidebarToggleMobile = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (sidebar) {
        // Get saved sidebar state from localStorage
        const savedState = localStorage.getItem('sidebarCollapsed');
        const isCollapsed = savedState === 'true';

        // Initialize sidebar state
        function initSidebar() {
            if (window.innerWidth >= 1024) {
                // Desktop: collapsed state (narrow sidebar)
                if (isCollapsed) {
                    collapseSidebar();
                } else {
                    expandSidebar();
                }
            } else {
                // Mobile: hidden by default
                hideSidebarMobile();
            }
        }

        function collapseSidebar() {
            sidebar.classList.add('collapsed');
            sidebar.style.width = '80px';
            if (mainContent) {
                mainContent.style.marginLeft = '80px';
            }

            // Hide text, show icons only
            const sidebarTexts = sidebar.querySelectorAll('.sidebar-text');
            sidebarTexts.forEach(text => {
                text.style.display = 'none';
            });

            const logoFull = sidebar.querySelector('.sidebar-logo-full');
            const logoCollapsed = sidebar.querySelector('.sidebar-logo-collapsed');
            if (logoFull) logoFull.style.display = 'none';
            if (logoCollapsed) logoCollapsed.style.display = 'block';

            localStorage.setItem('sidebarCollapsed', 'true');
        }

        function expandSidebar() {
            sidebar.classList.remove('collapsed');
            sidebar.style.width = '256px';
            if (mainContent) {
                mainContent.style.marginLeft = '256px';
            }

            // Show text
            const sidebarTexts = sidebar.querySelectorAll('.sidebar-text');
            sidebarTexts.forEach(text => {
                text.style.display = 'block';
            });

            const logoFull = sidebar.querySelector('.sidebar-logo-full');
            const logoCollapsed = sidebar.querySelector('.sidebar-logo-collapsed');
            if (logoFull) logoFull.style.display = 'block';
            if (logoCollapsed) logoCollapsed.style.display = 'none';

            localStorage.setItem('sidebarCollapsed', 'false');
        }

        function showSidebarMobile() {
            sidebar.style.transform = 'translateX(0)';
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('hidden');
            }
        }

        function hideSidebarMobile() {
            sidebar.style.transform = 'translateX(-100%)';
            if (sidebarOverlay) {
                sidebarOverlay.classList.add('hidden');
            }
        }

        // Desktop toggle
        if (sidebarToggleDesktop) {
            sidebarToggleDesktop.addEventListener('click', function() {
                if (sidebar.classList.contains('collapsed')) {
                    expandSidebar();
                } else {
                    collapseSidebar();
                }
            });
        }

        // Mobile toggle buttons
        const sidebarToggleMobileBtn = document.getElementById('sidebar-toggle-mobile');
        if (sidebarToggleMobileBtn) {
            sidebarToggleMobileBtn.addEventListener('click', function() {
                if (sidebar.style.transform === 'translateX(-100%)' || !sidebar.style.transform) {
                    showSidebarMobile();
                } else {
                    hideSidebarMobile();
                }
            });
        }

        if (sidebarToggleMobile) {
            sidebarToggleMobile.addEventListener('click', function() {
                hideSidebarMobile();
            });
        }

        // Overlay click to close on mobile
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', function() {
                hideSidebarMobile();
            });
        }

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth >= 1024) {
                    // Desktop
                    sidebar.style.transform = '';
                    sidebar.style.transition = 'width 0.3s ease-in-out';
                    if (mainContent) {
                        mainContent.style.marginLeft = '';
                    }
                    if (sidebarOverlay) {
                        sidebarOverlay.classList.add('hidden');
                    }
                    if (isCollapsed) {
                        collapseSidebar();
                    } else {
                        expandSidebar();
                    }
                } else {
                    // Mobile
                    sidebar.style.transition = 'transform 0.3s ease-in-out';
                    if (mainContent) {
                        mainContent.style.marginLeft = '0';
                    }
                    hideSidebarMobile();
                }
            }, 250);
        });

        // Set initial mobile state
        if (window.innerWidth < 1024 && mainContent) {
            mainContent.style.marginLeft = '0';
        }


        // Initialize sidebar on load
        initSidebar();

        // Mobile: start with sidebar hidden and add transition
        if (window.innerWidth < 1024) {
            sidebar.style.transition = 'transform 0.3s ease-in-out';
            sidebar.style.transform = 'translateX(-100%)';
        } else {
            sidebar.style.transition = 'width 0.3s ease-in-out';
        }
    }

    // Set bar chart heights from data attributes
    const barChartItems = document.querySelectorAll('.bar-chart-item');
    barChartItems.forEach(item => {
        const height = item.getAttribute('data-height');
        if (height) {
            item.style.height = height;
            // Ensure minimum visibility for very small values
            if (height.includes('%')) {
                const percentValue = parseFloat(height);
                if (percentValue > 0 && percentValue < 1) {
                    item.style.minHeight = '4px';
                }
            }
        }
    });
});

