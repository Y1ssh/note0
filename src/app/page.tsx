'use client';

import React from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/navigation/sidebar';
import { NotesGrid } from '@/components/notes/notes-grid';
import { SearchBar } from '@/components/notes/search-bar';
import { NewNoteButton } from '@/components/notes/new-note-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ToastProvider } from '@/components/ui/toast';

export default function HomePage() {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        <Header title="Note0 - Demo" />
        
        <div className="flex">
          <Sidebar className="hidden md:block" />
          
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              {/* Header Actions */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">My Notes</h2>
                <NewNoteButton onClick={() => alert('Create new note!')} />
              </div>

              {/* Search Bar */}
              <SearchBar 
                placeholder="Search notes..."
                className="mb-6"
                onChange={(value) => console.log('Search:', value)}
              />

              {/* Demo Components Section */}
              <Card className="mb-8">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Demo Components</h3>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Buttons */}
                  <div>
                    <h4 className="font-medium mb-3">Buttons:</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary">Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="danger">Danger</Button>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div>
                    <h4 className="font-medium mb-3">Inputs:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                      <Input placeholder="Enter text..." />
                      <Input label="With Label" placeholder="Labeled input" />
                      <Input label="With Error" error="This field is required" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes Grid */}
              <NotesGrid 
                onNoteClick={(note: any) => alert(`Clicked note: ${note.title}`)}
              />
            </div>
          </main>
        </div>
    </div>
    </ToastProvider>
  );
}
