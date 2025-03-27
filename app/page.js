'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { FolderCard } from './components/FolderCard';
import { ImageCard } from './components/ImageCard';
import { DropZone } from './components/DropZone';
import { ImageGallery } from './components/ImageGallery';
import { listFiles, uploadImage, deleteFile, getImageUrl } from './lib/supabase';
import { DragIndicator } from './components/DragIndicator';

export default function Home() {
  const [folders, setFolders] = useState([]);
  const [images, setImages] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isUploadImageModalOpen, setIsUploadImageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  const [isDraggingOverPage, setIsDraggingOverPage] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [galleryView, setGalleryView] = useState('grid'); // 'grid' or 'list'
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const mainRef = useRef(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Focus the first folder or image with Tab
      if (e.key === 'Tab' && !e.target.closest('button, input, select, textarea, [tabindex]')) {
        e.preventDefault();
        const firstFocusable = mainRef.current?.querySelector('[tabindex="0"]');
        firstFocusable?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle page drag and drop
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      if (!isUploadImageModalOpen) {
        setIsDraggingOverPage(true);
      }
    };

    const handleDragLeave = (e) => {
      if (!e.relatedTarget || !document.body.contains(e.relatedTarget)) {
        setIsDraggingOverPage(false);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDraggingOverPage(false);
      
      if (!isUploadImageModalOpen && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const validFiles = Array.from(e.dataTransfer.files).filter(file => 
          file.type.startsWith('image/')
        );
        
        if (validFiles.length > 0) {
          handleFilesUpload(validFiles);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [isUploadImageModalOpen, currentPath]);

  // Fetch folders and images
  useEffect(() => {
    fetchFilesAndFolders();
  }, [currentPath]);

  const fetchFilesAndFolders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await listFiles(currentPath);
      
      if (error) {
        console.error('Error fetching files:', error);
        return;
      }

      const foldersList = data
        .filter(item => item.id === null)
        .map(folder => ({
          ...folder,
          path: currentPath ? `${currentPath}/${folder.name}` : folder.name
        }));

      const imagesList = await Promise.all(
        data
          .filter(item => item.id !== null)
          .map(async (file) => {
            const url = await getImageUrl(currentPath ? `${currentPath}/${file.name}` : file.name);
            return {
              ...file,
              url,
              path: currentPath ? `${currentPath}/${file.name}` : file.name
            };
          })
      );

      setFolders(foldersList);
      setImages(imagesList);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation functions
  const handleFolderClick = (folderPath) => {
    setCurrentPath(folderPath);
  };

  const handleGoBack = () => {
    if (!currentPath) return;
    
    const pathParts = currentPath.split('/');
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  };

  // Create folder
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) return;
    
    try {
      const folderPath = currentPath 
        ? `${currentPath}/${newFolderName}/.keep` 
        : `${newFolderName}/.keep`;
      
      // Upload a placeholder file to create the folder
      const { error } = await uploadImage(new Blob(['']), folderPath);
      
      if (error) {
        console.error('Error creating folder:', error);
        return;
      }

      setNewFolderName('');
      setIsCreateFolderModalOpen(false);
      fetchFilesAndFolders();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Upload image
  const handleUploadImage = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    try {
      const filePath = currentPath 
        ? `${currentPath}/${selectedFile.name}` 
        : selectedFile.name;
      
      const { error } = await uploadImage(selectedFile, filePath);
      
      if (error) {
        console.error('Error uploading image:', error);
        return;
      }

      setSelectedFile(null);
      setIsUploadImageModalOpen(false);
      fetchFilesAndFolders();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle multiple files upload from drag and drop
  const handleFilesUpload = async (files) => {
    setIsLoading(true);
    let successCount = 0;

    try {
      for (const file of files) {
        const filePath = currentPath 
          ? `${currentPath}/${file.name}` 
          : file.name;
        
        const { error } = await uploadImage(file, filePath);
        
        if (!error) {
          successCount++;
        } else {
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      if (successCount > 0) {
        fetchFilesAndFolders();
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsLoading(false);
    }
  };

  // Delete folder or image
  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const { error } = await deleteFile(itemToDelete.path);
      
      if (error) {
        console.error('Error deleting item:', error);
        return;
      }

      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      fetchFilesAndFolders();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Confirm delete
  const confirmDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  // Image reordering with drag and drop
  const handleImageDragStart = (e, index) => {
    setDraggedImageIndex(index);
    setIsDraggingImage(true);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleImageDragOver = (e, index) => {
    e.preventDefault();
    if (draggedImageIndex === null || draggedImageIndex === index) return;
    
    // Reorder images
    const newImages = [...images];
    const draggedImage = newImages[draggedImageIndex];
    
    newImages.splice(draggedImageIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setImages(newImages);
    setDraggedImageIndex(index);
  };

  const handleImageDrop = (e, index) => {
    e.preventDefault();
    setDraggedImageIndex(null);
    setIsDraggingImage(false);
  };
  
  const handleDragEnd = () => {
    setDraggedImageIndex(null);
    setIsDraggingImage(false);
  };

  // Open gallery view with a specific image
  const openGallery = (index) => {
    setGalleryInitialIndex(index);
    setIsGalleryOpen(true);
  };

  // Handle image card click
  const handleImageClick = (index) => {
    openGallery(index);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">SupaDrive</h1>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCreateFolderModalOpen(true)}
              >
                New Folder
              </Button>
              <Button
                onClick={() => setIsUploadImageModalOpen(true)}
                variant="outline"
              >
                Upload Image
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main ref={mainRef} className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs & Back button */}
        <div className="mb-6 flex items-center">
          {currentPath && (
            <Button 
              variant="ghost" 
              onClick={handleGoBack}
              className="mr-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </Button>
          )}
          <div className="text-sm breadcrumbs">
            <span className="font-medium">
              {currentPath ? currentPath : 'Root'}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div>
            {/* Folders */}
            {folders.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium mb-4">Folders</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {folders.map((folder) => (
                    <FolderCard
                      key={folder.name}
                      name={folder.name}
                      onClick={() => handleFolderClick(folder.path)}
                      onDelete={() => confirmDelete(folder)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {images.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Images</h2>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mr-2">
                      View:
                    </p>
                    <button
                      onClick={() => setGalleryView('grid')}
                      className={`p-2 rounded-md ${galleryView === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      aria-label="Grid view"
                      title="Grid view"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                    </button>
                    <button
                      onClick={() => setGalleryView('list')}
                      className={`p-2 rounded-md ${galleryView === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      aria-label="List view"
                      title="List view"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Drag and drop to reorder images. Double-click to view in fullscreen.
                </p>
                
                {galleryView === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map((image, index) => (
                      <ImageCard
                        key={image.name}
                        name={image.name}
                        url={image.url}
                        onDelete={() => confirmDelete(image)}
                        index={index}
                        onDragStart={handleImageDragStart}
                        onDragOver={handleImageDragOver}
                        onDrop={handleImageDrop}
                        isDragging={draggedImageIndex === index}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {images.map((image, index) => (
                      <div 
                        key={image.name}
                        className={`flex items-center p-3 border-b border-gray-200 dark:border-gray-700 ${
                          draggedImageIndex === index ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        } transition-colors cursor-pointer`}
                        draggable={true}
                        onDragStart={(e) => handleImageDragStart(e, index)}
                        onDragOver={(e) => handleImageDragOver(e, index)}
                        onDrop={(e) => handleImageDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleImageClick(index)}
                        onDoubleClick={() => handleImageClick(index)}
                      >
                        <div className="w-12 h-12 mr-3 relative rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={image.url}
                            alt={image.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow overflow-hidden">
                          <p className="font-medium truncate">{image.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {new URL(image.url).pathname.split('/').pop()}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(image.url);
                            }}
                            aria-label="Copy image link"
                            title="Copy link"
                            icon={
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                              </svg>
                            }
                          />
                          <Button 
                            variant="ghost"
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(image.url, '_blank');
                            }}
                            aria-label="View image"
                            title="View image"
                            icon={
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            }
                          />
                          <Button 
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(image);
                            }}
                            aria-label="Delete image"
                            title="Delete"
                            icon={
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18"></path>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state */}
            {folders.length === 0 && images.length === 0 && (
              <div className="text-center py-12">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No items found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a new folder or uploading an image.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button
                    onClick={() => setIsCreateFolderModalOpen(true)}
                  >
                    New Folder
                  </Button>
                  <Button
                    onClick={() => setIsUploadImageModalOpen(true)}
                    variant="outline"
                  >
                    Upload Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Folder Modal */}
      <Modal
        isOpen={isCreateFolderModalOpen}
        onClose={() => setIsCreateFolderModalOpen(false)}
        title="Create New Folder"
        footer={
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsCreateFolderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateFolder}>
          <div className="mb-4">
            <label htmlFor="folderName" className="block text-sm font-medium mb-1">
              Folder Name
            </label>
            <input
              id="folderName"
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
              placeholder="Enter folder name"
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* Upload Image Modal */}
      <Modal
        isOpen={isUploadImageModalOpen}
        onClose={() => setIsUploadImageModalOpen(false)}
        title="Upload Image"
        footer={
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsUploadImageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadImage}
              disabled={!selectedFile}
            >
              Upload
            </Button>
          </div>
        }
      >
        <div className="mb-4">
          <DropZone 
            onFilesAccepted={(files) => {
              if (files.length > 0) {
                setSelectedFile(files[0]);
              }
            }} 
          />
        </div>
        {selectedFile && (
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              Selected: {selectedFile.name}
            </p>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete"
        footer={
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="danger"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p>
          Are you sure you want to delete{' '}
          <span className="font-semibold">
            {itemToDelete?.name}
          </span>
          ?
          {itemToDelete?.id === null && (
            <span className="block mt-2 text-sm text-red-500">
              This will also delete all contents inside the folder.
            </span>
          )}
        </p>
      </Modal>

      {/* Image Gallery */}
      <ImageGallery 
        images={images}
        initialIndex={galleryInitialIndex}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* Whole page drag and drop overlay */}
      {isDraggingOverPage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 mx-auto text-blue-500 mb-4" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
              <path d="M12 12v9"></path>
              <path d="m16 16-4-4-4 4"></path>
            </svg>
            <h3 className="text-xl font-medium mb-2">Drop images to upload</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Drop your images here to upload them to {currentPath || 'Root'}
            </p>
          </div>
        </div>
      )}

      {/* Drag indicator */}
      <DragIndicator isVisible={isDraggingImage} />
    </div>
  );
}
