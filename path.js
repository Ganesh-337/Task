// Initialize learning path animations
function initializeLearningPath() {
    const pathNodes = document.querySelectorAll('.path-node');
    const pathConnectors = document.querySelectorAll('.path-split');
    
    // Reset animations
    pathNodes.forEach(node => {
        node.style.opacity = '0';
        node.style.transform = 'translateY(20px)';
    });

    // Animate nodes sequentially
    pathNodes.forEach((node, index) => {
        setTimeout(() => {
            node.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            node.style.opacity = '1';
            node.style.transform = 'translateY(0)';
        }, index * 200);

        // Add click event listener
        node.addEventListener('click', () => handleNodeClick(node));
    });

    // Animate connectors
    pathConnectors.forEach((connector, index) => {
        setTimeout(() => {
            connector.classList.add('active');
        }, (pathNodes.length + index) * 200);
    });
}

// Handle node click
function handleNodeClick(node) {
    // Remove active class from all nodes
    document.querySelectorAll('.path-node').forEach(n => {
        n.classList.remove('active');
    });

    // Add active class to clicked node
    node.classList.add('active');

    // Get node content
    const title = node.querySelector('h3').textContent;
    const description = node.querySelector('p')?.textContent || '';

    // Show node details (you can customize this part)
    showNodeDetails(title, description);
}

// Show node details
function showNodeDetails(title, description) {
    // You can customize this function to show details in a modal, sidebar, or other UI element
    console.log('Selected Topic:', title);
    console.log('Description:', description);
    
    // Example: Show in an alert (you might want to create a better UI for this)
    alert(`${title}\n\n${description}`);
}

// Add resize handler for responsive layout
window.addEventListener('resize', () => {
    const pathSplits = document.querySelectorAll('.path-split');
    const isMobile = window.innerWidth <= 768;

    pathSplits.forEach(split => {
        if (isMobile) {
            split.classList.add('mobile');
        } else {
            split.classList.remove('mobile');
        }
    });
}); 