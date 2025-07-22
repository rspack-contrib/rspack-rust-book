(() => {
  'use strict';

  function findAndMarkMermaid() {
    // Select all mermaid elements that are not yet marked as 'ready'
    const mermaidElements = document.querySelectorAll(
      '.mermaid:not(.mermaid-ready)'
    );

    mermaidElements.forEach((element) => {
      // Check if the SVG has been rendered inside
      if (element.querySelector('svg')) {
        element.classList.add('mermaid-ready');
      }
    });
  }

  function startObserver() {
    // Set up a MutationObserver to watch for changes in the document body
    const observer = new MutationObserver((mutationsList, observer) => {
      // For any change, re-run the check
      findAndMarkMermaid();

      // Optional: Disconnect if all are found to save resources
      const remaining = document.querySelectorAll(
        '.mermaid:not(.mermaid-ready)'
      );
      if (remaining.length === 0) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true, // Watch for added/removed nodes
      subtree: true, // Watch the entire subtree
    });

    // Initial check in case diagrams are already rendered
    findAndMarkMermaid();
  }

  // Start observing once the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }
})();
