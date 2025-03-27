'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { FolderCard } from './components/FolderCard';
import { ImageCard } from './components/ImageCard';
import { DropZone } from './components/DropZone';
import { ImageGallery } from './components/ImageGallery';
import { UploadProgress } from './components/UploadProgress';
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
  const [uploadProgress, setUploadProgress] = useState({
    total: 0,
    processed: 0,
    uploading: false,
    folders: new Set(),
  });
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [itemToRename, setItemToRename] = useState(null);
  const [newName, setNewName] = useState('');
  const [isJsonViewOpen, setIsJsonViewOpen] = useState(false);
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

    const extractImagesFromFileList = async (fileList) => {
      const validFiles = [];
      
      // Process each item in the file list
      for (let i = 0; i < fileList.length; i++) {
        const item = fileList[i];
        
        if (item.type.startsWith('image/')) {
          // Direct image file
          validFiles.push(item);
        } else if (item.webkitGetAsEntry && item.webkitGetAsEntry()) {
          // Check if it's a directory
          const entry = item.webkitGetAsEntry();
          if (entry.isDirectory) {
            const dirFiles = await readDirectoryContents(entry);
            validFiles.push(...dirFiles);
          } else if (entry.isFile) {
            // Process file entry
            const file = await getFileFromEntry(entry);
            if (file && file.type.startsWith('image/')) {
              validFiles.push(file);
            }
          }
        }
      }
      
      return validFiles;
    };
    
    const readDirectoryContents = (dirEntry) => {
      return new Promise((resolve) => {
        const dirReader = dirEntry.createReader();
        const imageFiles = [];

        // Recursive function to read all directory contents
        const readEntries = () => {
          dirReader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve(imageFiles);
              return;
            }

            for (const entry of entries) {
              if (entry.isFile) {
                // Get file
                const file = await getFileFromEntry(entry);
                if (file && file.type.startsWith('image/')) {
                  // Only add image files
                  imageFiles.push(file);
                }
              } else if (entry.isDirectory) {
                // Process subdirectory
                const subDirFiles = await readDirectoryContents(entry);
                imageFiles.push(...subDirFiles);
              }
            }

            // Continue reading (some browsers limit the entries returned in a single call)
            readEntries();
          });
        };

        readEntries();
      });
    };

    const getFileFromEntry = (fileEntry) => {
      return new Promise((resolve) => {
        fileEntry.file(file => {
          // Create a new File object with path information
          const enhancedFile = new File(
            [file], 
            file.name, 
            { type: file.type }
          );
          
          // Add the relative path to help maintain folder structure
          enhancedFile.relativePath = fileEntry.fullPath.substring(1); // Remove leading slash
          
          resolve(enhancedFile);
        }, error => {
          console.error('Error getting file:', error);
          resolve(null);
        });
      });
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      setIsDraggingOverPage(false);
      
      // If upload modal is open, let the modal handle the drop
      if (isUploadImageModalOpen) return;
      
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        // Use the items API which supports directories
        try {
          // Show loading state while processing folders
          setIsLoading(true);
          
          const extractedImages = await extractImagesFromFileList(e.dataTransfer.items);
          
          if (extractedImages.length > 0) {
            handleFilesUpload(extractedImages);
          } else {
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Error processing dropped items:', error);
          setIsLoading(false);
        }
      } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // Fallback for browsers not supporting DataTransferItemList
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
    let errorCount = 0;
    
    // Initialize upload progress
    setUploadProgress({
      total: files.length,
      processed: 0,
      uploading: true,
      folders: new Set(),
    });

    try {
      // Group files by directory to maintain folder structure
      const filesByDirectory = {};
      const detectedFolders = new Set();
      
      // Process each file and organize by directory
      for (const file of files) {
        // Check if the file has a relativePath property from a folder drop
        let filePath;
        if (file.relativePath) {
          // If from folder drop, use the relative path
          // Handle potential nested folders
          const pathParts = file.relativePath.split('/');
          
          // If the file is in a subdirectory, create the folder structure
          if (pathParts.length > 1) {
            // Last part is the filename, so exclude it
            const folderPath = pathParts.slice(0, -1).join('/');
            
            // Add to the current path with folder structure
            filePath = currentPath 
              ? `${currentPath}/${folderPath}/${file.name}`
              : `${folderPath}/${file.name}`;
              
            // Track directories for UI updating
            const directoryPath = currentPath 
              ? `${currentPath}/${folderPath}`
              : folderPath;
              
            // Add folder to tracking set
            detectedFolders.add(directoryPath);
              
            if (!filesByDirectory[directoryPath]) {
              filesByDirectory[directoryPath] = [];
            }
            filesByDirectory[directoryPath].push(file);
          } else {
            // File is directly in the dropped folder
            filePath = currentPath 
              ? `${currentPath}/${file.name}` 
              : file.name;
          }
        } else {
          // Regular file upload without folder structure
          filePath = currentPath 
            ? `${currentPath}/${file.name}` 
            : file.name;
        }
        
        // Upload the file
        const { error } = await uploadImage(file, filePath);
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          processed: prev.processed + 1,
          folders: detectedFolders
        }));
        
        if (!error) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      // Show results message
      const totalFiles = files.length;
      if (successCount > 0) {
        // Success notification could be added here
        console.log(`Successfully uploaded ${successCount} of ${totalFiles} files`);
      }
      
      if (errorCount > 0) {
        // Error notification could be added here
        console.error(`Failed to upload ${errorCount} of ${totalFiles} files`);
      }

      // Refresh file list
      fetchFilesAndFolders();
    } catch (error) {
      console.error('Error uploading files:', error);
      setIsLoading(false);
    } finally {
      // Reset progress when done
      setTimeout(() => {
        setUploadProgress({
          total: 0,
          processed: 0,
          uploading: false,
          folders: new Set()
        });
      }, 1500);
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

  // Add this function to handle renaming
  const handleRename = async (e) => {
    e.preventDefault();
    
    if (!itemToRename || !newName.trim()) return;
    
    try {
      setIsLoading(true);
      
      // For image files
      if (itemToRename.id) {
        // Get source and destination paths
        const sourcePath = itemToRename.path;
        const pathParts = sourcePath.split('/');
        pathParts[pathParts.length - 1] = newName;
        const destinationPath = pathParts.join('/');
        
        // Get the file from the URL
        const response = await fetch(itemToRename.url);
        const fileBlob = await response.blob();
        
        // Upload to the new path
        const { error: uploadError } = await uploadImage(fileBlob, destinationPath);
        
        if (uploadError) {
          console.error('Error uploading to new path:', uploadError);
          return;
        }
        
        // Delete the old file
        const { error: deleteError } = await deleteFile(sourcePath);
        
        if (deleteError) {
          console.error('Error deleting old file:', deleteError);
        }
      } 
      // For folders
      else {
        // We need to move all content from old folder to new folder
        const oldFolderPath = itemToRename.path;
        const pathParts = oldFolderPath.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newFolderPath = pathParts.join('/');
        
        // Create new folder
        await uploadImage(new Blob(['']), `${newFolderPath}/.keep`);
        
        // List all files in the old folder
        const { data, error } = await listFiles(oldFolderPath);
        
        if (error) {
          console.error('Error listing files in folder:', error);
          return;
        }
        
        // Move all files to the new folder
        if (data && data.length > 0) {
          for (const item of data) {
            // Skip the .keep file
            if (item.name === '.keep') continue;
            
            // Construct paths
            const oldItemPath = `${oldFolderPath}/${item.name}`;
            const newItemPath = `${newFolderPath}/${item.name}`;
            
            if (item.id) {
              // It's a file, so download and reupload
              const fileUrl = await getImageUrl(oldItemPath);
              const response = await fetch(fileUrl);
              const fileBlob = await response.blob();
              
              await uploadImage(fileBlob, newItemPath);
              await deleteFile(oldItemPath);
            } else {
              // It's a subfolder
              // Recursive renaming would be needed here for complete implementation
              // This is simplified for now
              await uploadImage(new Blob(['']), `${newItemPath}/.keep`);
            }
          }
        }
        
        // Delete old folder (.keep file)
        await deleteFile(`${oldFolderPath}/.keep`);
      }
      
      // Close modal and refresh
      setIsRenameModalOpen(false);
      setItemToRename(null);
      setNewName('');
      fetchFilesAndFolders();
    } catch (error) {
      console.error('Error renaming item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to set up the rename process
  const setupRename = (item) => {
    setItemToRename(item);
    setNewName(item.name);
    setIsRenameModalOpen(true);
  };

  // Rewrite the recursive folder function to handle nested folders properly
  const getFolderContentsRecursive = async (folderPath) => {
    try {
      // Get the direct contents of this folder
      const { data, error } = await listFiles(folderPath);
      
      if (error) {
        console.error('Error fetching folder contents:', error);
        return { folders: [], files: [] };
      }

      // Process files in this folder (excluding .keep)
      const filesList = await Promise.all(
        data
          .filter(item => item.id !== null && item.name !== '.keep')
          .map(async (file) => {
            const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;
            const url = await getImageUrl(fullPath);
            return {
              ...file,
              url,
              path: fullPath
            };
          })
      );

      // Process folders
      const foldersList = data
        .filter(item => item.id === null)
        .map(folder => ({
          ...folder,
          path: folderPath ? `${folderPath}/${folder.name}` : folder.name
        }));

      // Recursively process each subfolder
      const processedFolders = await Promise.all(
        foldersList.map(async (folder) => {
          // Get contents of this subfolder
          const subfolderContents = await getFolderContentsRecursive(folder.path);
          
          return {
            name: folder.name,
            path: folder.path,
            files: subfolderContents.files,
            folders: subfolderContents.folders,
          };
        })
      );

      return {
        folders: processedFolders,
        files: filesList
      };
    } catch (error) {
      console.error('Error in recursive folder fetch:', error);
      return { folders: [], files: [] };
    }
  };

  // Update the JSON formatting utility to handle nested structure better
  const formatNestedJson = (data) => {
    if (!data) return null;
    
    const mapFiles = (files) => {
      return files.map(file => ({
        name: file.name,
        path: file.path,
        url: file.url,
        size: file.metadata?.size,
        type: file.metadata?.mimetype
      }));
    };
    
    // Create a cleaner representation of the data
    return {
      currentDirectory: currentPath || 'Root',
      folders: data.folders.map(folder => ({
        name: folder.name,
        path: folder.path,
        files: folder.files ? mapFiles(folder.files) : [],
        folders: folder.folders || []
      })),
      files: mapFiles(data.files || [])
    };
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
              <Button
                onClick={() => setIsJsonViewOpen(true)}
                variant="secondary"
                title="View JSON data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
                JSON
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
                    >
                      <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setupRename(folder);
                            }}
                            className="rounded-full shadow-md bg-white/90 dark:bg-gray-800/90"
                            aria-label="Rename folder"
                            title="Rename folder"
                          >
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
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(folder);
                            }}
                            className="rounded-full shadow-md"
                            aria-label="Delete folder"
                            title="Delete folder"
                          >
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
                          </Button>
                        </div>
                      </div>
                    </FolderCard>
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
                        onRename={() => setupRename(image)}
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
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setupRename(image);
                            }}
                            aria-label="Rename image"
                            title="Rename"
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
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3 className="text-xl font-medium mb-2">Drop to upload</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Drop folders or images here to upload them to {currentPath || 'Root'}
            </p>
            <p className="text-xs text-blue-500">
              Folder structure will be preserved
            </p>
          </div>
        </div>
      )}

      {/* Drag indicator */}
      <DragIndicator isVisible={isDraggingImage} />
      
      {/* Upload progress */}
      <UploadProgress progress={uploadProgress} />

      {/* Rename Modal */}
      <Modal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        title={`Rename ${itemToRename?.id ? 'Image' : 'Folder'}`}
        footer={
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsRenameModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRename}
              disabled={!newName.trim()}
            >
              Rename
            </Button>
          </div>
        }
      >
        <form onSubmit={handleRename}>
          <div className="mb-4">
            <label htmlFor="newName" className="block text-sm font-medium mb-1">
              New Name
            </label>
            <input
              id="newName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
              placeholder="Enter new name"
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* JSON View Modal */}
      <Modal
        isOpen={isJsonViewOpen}
        onClose={() => setIsJsonViewOpen(false)}
        title="JSON Data View"
        footer={
          <div className="flex justify-end gap-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsJsonViewOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={async () => {
                setIsLoading(true);
                try {
                  const fullData = await getFolderContentsRecursive(currentPath);
                  const formattedData = formatNestedJson(fullData);
                  const jsonString = JSON.stringify(formattedData, null, 2);
                  navigator.clipboard.writeText(jsonString);
                  alert("Complete folder structure copied to clipboard! Includes all files in nested folders.");
                } catch (error) {
                  console.error("Error generating JSON:", error);
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Copy Complete JSON
            </Button>
            <Button
              onClick={() => {
                const simpleJson = JSON.stringify({ folders, images }, null, 2);
                navigator.clipboard.writeText(simpleJson);
                alert("Current view JSON copied to clipboard!");
              }}
            >
              Copy Current View
            </Button>
          </div>
        }
      >
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Choose an option:</p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const fullData = await getFolderContentsRecursive(currentPath);
                  const formattedData = formatNestedJson(fullData);
                  
                  // Debug output
                  console.log('Recursive folder data:', fullData);
                  console.log('Formatted data:', formattedData);
                  
                  const jsonEl = document.getElementById('json-view');
                  if (jsonEl) {
                    jsonEl.textContent = JSON.stringify(formattedData, null, 2);
                  }
                } catch (error) {
                  console.error("Error generating JSON:", error);
                } finally {
                  setIsLoading(false);
                }
              }}
              className="w-full justify-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                <line x1="9" y1="10" x2="15" y2="10"></line>
              </svg>
              Load Complete Folder Structure with Files
            </Button>
            <Button
              onClick={() => {
                const jsonEl = document.getElementById('json-view');
                if (jsonEl) {
                  jsonEl.textContent = JSON.stringify({ folders, images }, null, 2);
                }
              }}
              variant="outline"
              className="w-full justify-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              Show Current View Only
            </Button>
          </div>
        </div>
        <div className="overflow-auto max-h-96">
          {isLoading ? (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <pre id="json-view" className="text-xs p-4 bg-gray-100 dark:bg-gray-900 rounded-md overflow-auto">
              {JSON.stringify({ folders, images }, null, 2)}
            </pre>
          )}
        </div>
      </Modal>
    </div>
  );
}
