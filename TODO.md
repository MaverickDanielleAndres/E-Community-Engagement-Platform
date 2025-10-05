# Add Media Upload to Complaints

## Tasks
- [ ] Create Supabase storage bucket "complaint-media" (USER ACTION REQUIRED)
- [ ] Add media_urls JSONB column to complaints table (USER ACTION REQUIRED)
- [ ] Update user complaint submit form to accept image/video uploads
- [ ] Modify POST /api/complaints to handle FormData and upload files to Supabase storage
- [x] Update GET /api/complaints to include media_urls in response
- [x] Update admin complaint detail view to display and allow interaction with media
- [ ] Test the complete flow: submit with media, view as admin
