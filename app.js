const API_BASE_URL = 'http://localhost:5000/api';

// Elementos DOM
let projectsGrid, uploadForm, uploadStatus, fileInfo, projectFile;

// Estado de la aplicación
let currentProjects = [];
let currentFilter = 'all';

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Obtener referencias a elementos DOM
    projectsGrid = document.getElementById('projects-grid');
    uploadForm = document.getElementById('upload-form');
    uploadStatus = document.getElementById('upload-status');
    fileInfo = document.getElementById('file-info');
    projectFile = document.getElementById('project-file');
    
    // Configurar event listeners
    setupEventListeners();
    
    // Cargar proyectos iniciales
    loadProjects();
});

// Configurar event listeners
function setupEventListeners() {
    // Filtros de proyectos
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remover clase active de todos los botones
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Añadir clase active al botón clickeado
            this.classList.add('active');
            // Filtrar proyectos
            currentFilter = this.getAttribute('data-filter');
            renderProjects(currentFilter);
        });
    });
    
    // Formulario de subida
    uploadForm.addEventListener('submit', handleProjectUpload);
    
    // Mostrar información del archivo seleccionado
    projectFile.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            const fileSize = formatFileSize(file.size);
            fileInfo.textContent = `Archivo: ${file.name} (${fileSize})`;
        } else {
            fileInfo.textContent = '';
        }
    });
    
    // Modal
    const modal = document.getElementById('project-modal');
    const closeModal = document.querySelector('.close-modal');
    const downloadBtn = document.getElementById('download-btn');
    const deleteBtn = document.getElementById('delete-btn');
    
    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    downloadBtn.addEventListener('click', downloadProject);
    deleteBtn.addEventListener('click', deleteProject);
}

// Cargar proyectos desde el API
async function loadProjects() {
    try {
        projectsGrid.innerHTML = '<div class="loading">Cargando proyectos...</div>';
        
        const response = await fetch(`${API_BASE_URL}/projects`);
        if (!response.ok) {
            throw new Error('Error al cargar proyectos');
        }
        
        currentProjects = await response.json();
        renderProjects(currentFilter);
    } catch (error) {
        console.error('Error:', error);
        projectsGrid.innerHTML = `
            <div class="error-message">
                Error al cargar los proyectos. Asegúrate de que el servidor esté ejecutándose.
            </div>
        `;
    }
}

// Renderizar proyectos en la cuadrícula
function renderProjects(filter) {
    projectsGrid.innerHTML = '';
    
    if (currentProjects.length === 0) {
        projectsGrid.innerHTML = '<div class="loading">No hay proyectos disponibles.</div>';
        return;
    }
    
    const filteredProjects = filter === 'all' 
        ? currentProjects 
        : currentProjects.filter(project => project.type === filter);
    
    if (filteredProjects.length === 0) {
        projectsGrid.innerHTML = '<div class="loading">No hay proyectos de este tipo.</div>';
        return;
    }
    
    filteredProjects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.dataset.id = project.id;
        
        // Determinar el icono según el tipo de proyecto
        let iconText = 'Proyecto';
        switch (project.type) {
            case 'python': iconText = 'Python'; break;
            case 'video': iconText = 'Video'; break;
            case 'musica': iconText = 'Música'; break;
            case 'juego': iconText = 'Juego'; break;
            default: iconText = 'Proyecto';
        }
        
        // Formatear fecha
        const uploadDate = new Date(project.uploadDate).toLocaleDateString();
        
        projectCard.innerHTML = `
            <div class="project-image">${iconText}</div>
            <div class="project-content">
                <h3>${project.title}</h3>
                <span class="project-type">${project.type}</span>
                <p>${project.description}</p>
                <div class="project-date">Subido: ${uploadDate}</div>
            </div>
        `;
        
        projectCard.addEventListener('click', () => showProjectDetails(project));
        projectsGrid.appendChild(projectCard);
    });
}

// Mostrar detalles del proyecto en modal
function showProjectDetails(project) {
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalType = document.getElementById('modal-type');
    const modalDescription = document.getElementById('modal-description');
    const downloadBtn = document.getElementById('download-btn');
    const deleteBtn = document.getElementById('delete-btn');
    
    modalTitle.textContent = project.title;
    modalType.textContent = project.type;
    modalDescription.textContent = project.description;
    
    // Configurar botones
    downloadBtn.dataset.id = project.id;
    deleteBtn.dataset.id = project.id;
    
    // Mostrar modal
    modal.style.display = 'block';
}

// Manejar la subida de proyectos
async function handleProjectUpload(e) {
    e.preventDefault();
    
    const submitBtn = uploadForm.querySelector('.submit-btn');
    const formData = new FormData(uploadForm);
    
    // Validar formulario
    const title = formData.get('title');
    const description = formData.get('description');
    const type = formData.get('type');
    const file = formData.get('projectFile');
    
    if (!title || !description || !type || !file) {
        showUploadStatus('Por favor, completa todos los campos', 'error');
        return;
    }
    
    try {
        // Deshabilitar botón durante la subida
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subiendo...';
        
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al subir el proyecto');
        }
        
        const result = await response.json();
        showUploadStatus(result.message, 'success');
        uploadForm.reset();
        fileInfo.textContent = '';
        
        // Recargar proyectos
        await loadProjects();
        
    } catch (error) {
        console.error('Error:', error);
        showUploadStatus(error.message, 'error');
    } finally {
        // Rehabilitar botón
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subir Proyecto';
    }
}

// Descargar proyecto
async function downloadProject() {
    const projectId = this.dataset.id;
    try {
        window.open(`${API_BASE_URL}/projects/${projectId}/download`, '_blank');
    } catch (error) {
        console.error('Error al descargar:', error);
        alert('Error al descargar el proyecto');
    }
}

// Eliminar proyecto
async function deleteProject() {
    const projectId = this.dataset.id;
    const confirmed = confirm('¿Estás seguro de que quieres eliminar este proyecto?');
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el proyecto');
        }
        
        // Cerrar modal y recargar proyectos
        document.getElementById('project-modal').style.display = 'none';
        await loadProjects();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el proyecto');
    }
}

// Mostrar estado de la subida
function showUploadStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = type === 'success' ? 'upload-success' : 'upload-error';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        uploadStatus.textContent = '';
        uploadStatus.className = '';
    }, 5000);
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función para hacer scroll suave a una sección
function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Navegación suave para enlaces internos
document.querySelectorAll('nav a, .footer-section a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        scrollToSection(targetId);
    });
});