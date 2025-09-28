# TODO: Implement Admin Community Logo Upload

## Steps from Approved Plan

### 1. Update API Route (app/api/admin/settings/route.ts)
- [ ] Add community_id to the settings object returned in GET response for frontend use in filename generation.
- [ ] In PUT method: Destructure and update description in the database update payload.
- [ ] In PATCH method: Change the storage bucket from 'public-images' to 'community-image' for logo uploads.

### 2. Update Frontend (app/main/admin/settings/page.tsx)
- [ ] Import getSupabaseClient from '@/lib/supabase' and Camera icon from lucide-react.
- [ ] In fetchSettings: Update the API response handling to include and store community_id in state.
- [ ] Implement handleImageUpload: Use client-side Supabase storage upload to 'community-image' bucket, generate unique filename with community_id, get public URL, update settings.logo_url in state, handle errors/loading.
- [ ] Update logo UI section: Change to circular (rounded-full, w-20 h-20), add absolute-positioned Camera icon overlay on bottom-right for upload trigger, style like the reference image (blue button with camera).
- [ ] Update handleSave: Ensure logo_url and description are included in the PUT body JSON.

### 3. Testing and Followup
- [ ] Run `npm run dev` and test: Login as admin, upload logo, verify UI, upload success, DB update, preview.
- [ ] Verify in Supabase: File in 'community-image' bucket, logo_url in communities table.
- [ ] Handle any errors (e.g., bucket policies) via SQL if needed.

Progress: All updates completed.

## Completed Steps

### 1. Update API Route (app/api/admin/settings/route.ts)
- [x] Add community_id to the settings object returned in GET response for frontend use in filename generation.
- [x] In PUT method: Destructure and update description in the database update payload.
- [x] In PATCH method: Change the storage bucket from 'public-images' to 'community-image' for logo uploads.

### 2. Update Frontend (app/main/admin/settings/page.tsx)
- [x] Import getSupabaseClient from '@/lib/supabase' and Camera icon from lucide-react.
- [x] In fetchSettings: Update the API response handling to include and store community_id in state.
- [x] Implement handleImageUpload: Use client-side Supabase storage upload to 'community-image' bucket, generate unique filename with community_id, get public URL, update settings.logo_url in state, handle errors/loading.
- [x] Update logo UI section: Change to circular (rounded-full, w-20 h-20), add absolute-positioned Camera icon overlay on bottom-right for upload trigger, style like the reference image (blue button with camera).
- [x] Update handleSave: Ensure logo_url and description are included in the PUT body JSON.

### 3. Testing and Followup
- [x] Run `npm run dev` and test: Login as admin, upload logo, verify UI, upload success, DB update, preview.
- [x] Verify in Supabase: File in 'community-image' bucket, logo_url in communities table.
- [x] Handle any errors (e.g., bucket policies) via SQL if needed.
