# SupaDrive

A modern web application for managing images in folders using Supabase for storage.

## Features

- Modern, clean UI built with Tailwind CSS
- Create and navigate folders
- Upload images to folders
- View images with thumbnails
- Delete folders and images
- Responsive design for all devices

## Tech Stack

- Next.js 15
- React 19
- Tailwind CSS 4
- Supabase Storage

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Supabase Setup

Before using the application, you need to set up a storage bucket and policies in your Supabase project. See the [supabase-setup.md](./supabase-setup.md) file for detailed instructions.

## App Structure

- `app/components/` - Reusable UI components
- `app/lib/supabase.js` - Supabase client and utility functions
- `app/page.js` - Main application page with folder and image management logic

## Usage

1. **Creating Folders**: Click the "New Folder" button, enter a folder name, and click "Create".
2. **Navigating Folders**: Click on a folder to open it. Use the back button to navigate to the parent folder.
3. **Uploading Images**: Click the "Upload Image" button, select an image file, and click "Upload".
4. **Deleting Items**: Hover over an item and click the delete icon. Confirm deletion in the modal.

## License

MIT
