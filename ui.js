import { getAssetById, updateAsset } from './state.js';
import { redrawCanvas, setTool } from './editor.js';

export let lastGeneratedAsset = null;

const loadingOverlay = document.getElementById('loading-overlay');
const propertiesPanel = document.getElementById('properties-panel-content');
const scenePrompt = document.getElementById('scene-prompt');
const saveBtn = document.getElementById('save-btn');
const assetLibrary = document.getElementById('asset-library');

export function showLoader() {
    loadingOverlay.style.display = 'flex';
}

export function hideLoader() {
    loadingOverlay.style.display = 'none';
}

export function updateLastGeneratedAsset(asset) {
    lastGeneratedAsset = asset;
}

export function selectLibraryAsset(element) {
    document.querySelectorAll('.library-asset').forEach(el => el.classList.remove('selected'));
    if (element) {
        element.classList.add('selected');
        updateLastGeneratedAsset({
            id: `asset_${Date.now()}`, // This is a template, ID will be unique on drop
            url: element.dataset.assetUrl,
            type: element.dataset.assetType,
            prompt: element.dataset.assetPrompt
        });
        // On mobile, selecting an asset should prime the "add" tool for tap-to-place
        if ('ontouchstart' in window) {
            setTool('add');
        }
    } else {
        updateLastGeneratedAsset(null);
    }
}

export function updatePropertiesPanel(assetId) {
    if (!assetId) {
        propertiesPanel.innerHTML = '<p>Select an asset to see its properties.</p>';
        return;
    }

    const asset = getAssetById(assetId);
    if (!asset) {
        propertiesPanel.innerHTML = '<p>Asset not found.</p>';
        return;
    }

    propertiesPanel.innerHTML = `
        <div class="control-group">
            <label>Name</label>
            <input type="text" id="prop-name" value="${asset.name}">
            <label>Type</label>
            <input type="text" id="prop-type" value="${asset.type}" disabled>
            <label>Prompt</label>
            <textarea id="prop-prompt" rows="3" disabled>${asset.prompt}</textarea>
            <label>X</label>
            <input type="number" id="prop-x" value="${Math.round(asset.x)}">
            <label>Y</label>
            <input type="number" id="prop-y" value="${Math.round(asset.y)}">
            <label>Width</label>
            <input type="number" id="prop-width" value="${Math.round(asset.width)}">
            <label>Height</label>
            <input type="number" id="prop-height" value="${Math.round(asset.height)}">
        </div>
    `;

    document.getElementById('prop-name').addEventListener('change', (e) => updateAsset(assetId, { name: e.target.value }));
    document.getElementById('prop-x').addEventListener('change', (e) => {
        updateAsset(assetId, { x: parseInt(e.target.value, 10) });
        redrawCanvas();
    });
    document.getElementById('prop-y').addEventListener('change', (e) => {
        updateAsset(assetId, { y: parseInt(e.target.value, 10) });
        redrawCanvas();
    });
    document.getElementById('prop-width').addEventListener('change', (e) => {
        updateAsset(assetId, { width: parseInt(e.target.value, 10) });
        redrawCanvas();
    });
    document.getElementById('prop-height').addEventListener('change', (e) => {
        updateAsset(assetId, { height: parseInt(e.target.value, 10) });
        redrawCanvas();
    });
}

const placeholderPrompts = [
    "A vibrant, magical forest clearing at dusk, fantasy art",
    "Cyberpunk city street at night, neon lights, rain",
    "Underwater coral reef teeming with bioluminescent creatures",
    "Steampunk airship soaring through clouds above a mountain range",
    "Alien desert landscape with two suns setting",
    "Cozy medieval tavern with a crackling fireplace",
    "Post-apocalyptic city ruins overgrown with nature",
    "Futuristic space station orbiting a gas giant",
    "Japanese zen garden with cherry blossoms and a koi pond",
    "Haunted Victorian mansion on a stormy night"
];

let promptIndex = 0;
let charIndex = 0;
let isDeleting = false;

export function animatePlaceholder() {
    const currentPrompt = placeholderPrompts[promptIndex];
    let targetText;

    if (isDeleting) {
        targetText = currentPrompt.substring(0, charIndex--);
    } else {
        targetText = currentPrompt.substring(0, charIndex++);
    }

    scenePrompt.placeholder = targetText;

    if (!isDeleting && charIndex === currentPrompt.length + 1) {
        isDeleting = true;
        setTimeout(animatePlaceholder, 2000); // Pause before deleting
        return;
    }

    if (isDeleting && charIndex === -1) {
        isDeleting = false;
        promptIndex = (promptIndex + 1) % placeholderPrompts.length;
        charIndex = 0;
        setTimeout(animatePlaceholder, 500); // Pause before typing next
        return;
    }

    const typingSpeed = isDeleting ? 50 : 100;
    setTimeout(animatePlaceholder, typingSpeed);
}

export function setupPanelToggles() {
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const mobileToggleLeft = document.getElementById('mobile-toggle-left');
    const mobileToggleRight = document.getElementById('mobile-toggle-right');
    const toggleLeftPanelBtn = document.getElementById('toggle-left-panel');
    const toggleRightPanelBtn = document.getElementById('toggle-right-panel');

    const togglePanel = (panel) => {
        const isVisible = panel.classList.contains('visible');
        document.querySelectorAll('#left-panel, #right-panel').forEach(p => p.classList.remove('visible'));
        if (!isVisible) {
            panel.classList.add('visible');
        }
    };

    mobileToggleLeft.addEventListener('click', () => togglePanel(leftPanel));
    mobileToggleRight.addEventListener('click', () => togglePanel(rightPanel));
    toggleLeftPanelBtn.addEventListener('click', () => leftPanel.classList.remove('visible'));
    toggleRightPanelBtn.addEventListener('click', () => rightPanel.classList.remove('visible'));
}

export function addAssetToLibrary(asset) {
    const img = document.createElement('img');
    img.src = asset.url;
    img.title = asset.prompt;
    img.classList.add('library-asset');
    img.draggable = true;
    img.dataset.assetId = asset.id; // May not be needed, but good practice
    img.dataset.assetUrl = asset.url;
    img.dataset.assetType = asset.type;
    img.dataset.assetPrompt = asset.prompt;

    assetLibrary.appendChild(img);
    return img;
}

export function updateSaveButtonState(isDirty) {
    if (isDirty) {
        saveBtn.classList.add('dirty');
    } else {
        saveBtn.classList.remove('dirty');
    }
}