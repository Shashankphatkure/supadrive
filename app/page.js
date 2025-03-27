'use client';

import { useState, useEffect } from 'react';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { FolderCard } from './components/FolderCard';
import { ImageCard } from './components/ImageCard';
import { listFiles, uploadImage, deleteFile, getImageUrl } from './lib/supabase';

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

      <main className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <h2 className="text-lg font-medium mb-4">Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((image) => (
                    <ImageCard
                      key={image.name}
                      name={image.name}
                      url={image.url}
                      onDelete={() => confirmDelete(image)}
                    />
                  ))}
                </div>
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
        <form onSubmit={handleUploadImage}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Select Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800"
            />
          </div>
          {selectedFile && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                Selected: {selectedFile.name}
              </p>
            </div>
          )}
        </form>
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
    </div>
  );
}
