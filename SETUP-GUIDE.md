# Note0 Setup Guide

This guide will help you set up the complete Note0 note-taking application.

## Prerequisites

- Node.js v20+ (we're using v22.17.0)
- pnpm package manager
- Git
- A Supabase account (free tier works)
- Google AI Studio account for Gemini API (optional but recommended)

## Phase 1 & 2: Completed ✅

- ✅ Next.js 14 project with TypeScript & Tailwind CSS v4
- ✅ All dependencies installed (Supabase, Gemini AI, CodeMirror, etc.)
- ✅ Complete folder structure and TypeScript types
- ✅ Utility functions and constants configured

## Phase 3: Database Setup (Manual Steps Required)

### Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `note0` 
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

### Step 2: Get Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (starts with `https://xxx.supabase.co`)
   - **Anon public key** (starts with `eyJhbGc...`)

### Step 3: Configure Environment Variables

1. In your Note0 project, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 4: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `database-schema.sql` (in project root)
3. Paste it into the SQL Editor
4. Click "Run" to execute the schema

This will create:
- ✅ `notes` table with hierarchical support
- ✅ `file_attachments` table for file uploads
- ✅ `export_jobs` table for export tracking
- ✅ All necessary indexes for performance
- ✅ Triggers for auto-updating timestamps and word counts
- ✅ Functions for hierarchy management and search
- ✅ Sample data to get started

### Step 5: Set Up Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Enter bucket details:
   - **Name**: `note-files`
   - **Public bucket**: ✅ Check this box
4. Click "Create bucket"

### Step 6: Configure Storage Policies

1. In the Storage section, click on your `note-files` bucket
2. Go to **Policies** tab
3. Click "New policy" and select "Full customization"
4. Add this policy for public access:

```sql
CREATE POLICY "Allow public uploads" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'note-files');

CREATE POLICY "Allow public downloads" ON storage.objects 
FOR SELECT USING (bucket_id = 'note-files');

CREATE POLICY "Allow public deletes" ON storage.objects 
FOR DELETE USING (bucket_id = 'note-files');
```

## Phase 4: AI Setup (Optional)

### Google Gemini API Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local`:
   ```env
   GEMINI_API_KEY=your-gemini-api-key-here
   ```

## Running the Application

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Verification Checklist

### Database Connection
- [ ] Notes table is created with sample data
- [ ] File attachments table exists
- [ ] Storage bucket `note-files` is created and public
- [ ] Environment variables are set correctly

### Application Features
- [ ] Homepage loads without errors
- [ ] Can create a new note
- [ ] Can edit existing notes
- [ ] Hierarchical structure works (parent/child notes)
- [ ] File upload works (if storage is configured)
- [ ] Search functionality works
- [ ] AI completion works (if Gemini API is configured)

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" error**
   - Ensure `.env.local` file exists with correct variables
   - Restart the development server after adding variables

2. **Database connection errors**
   - Verify Supabase project URL and anon key
   - Check if database schema was applied correctly
   - Ensure RLS policies are set correctly

3. **File upload errors** 
   - Verify storage bucket is created and public
   - Check storage policies are applied
   - Ensure bucket name matches code (`note-files`)

4. **TypeScript errors**
   - Run `pnpm type-check` to verify types
   - Some import errors may resolve after proper environment setup

## Next Steps

Once Phase 3 is complete, you'll be ready for:

- **Phase 4**: Core State Management (Zustand store)
- **Phase 5**: UI Components Development  
- **Phase 6**: Markdown Editor Implementation
- **Phase 7**: File Management System
- **Phase 8**: Export Functionality
- **Phase 9**: Hierarchical Notes System
- **Phase 10**: AI Integration
- And more...

## Database Schema Overview

The database includes these key tables:

### `notes`
- Hierarchical structure with `parent_id` foreign key
- Auto-calculated word count and reading time
- Tags array for categorization
- Metadata JSONB for extensibility
- Full-text search indexes

### `file_attachments`
- Links to notes via `note_id`
- Stores file metadata and Supabase storage paths
- Support for thumbnails and file type detection

### `export_jobs`
- Tracks export operations and progress
- Supports multiple formats (PDF, Markdown, JSON, ZIP)
- Includes download URLs and expiration

## Security Notes

- Current setup uses public access for simplicity (single-user app)
- For multi-user scenarios, implement proper RLS policies
- Store sensitive API keys in environment variables only
- Consider implementing rate limiting for AI features in production

---

**Next**: Continue to Phase 4 for state management setup once your database is configured! 