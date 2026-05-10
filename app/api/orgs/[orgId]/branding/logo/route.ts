// POST   /api/orgs/[orgId]/branding/logo  — multipart upload, owner-gated, sets organizations.logo_url
// DELETE /api/orgs/[orgId]/branding/logo  — owner-only, clears logo_url and removes the stored file
//
// Bucket: `org-branding` (public read, 2MB limit, png|jpg|webp|svg).
// Bucket created via `supabase-migrations/add_storage_org_branding.sql` — re-run if missing.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logError } from '@/lib/error-logger'

const BUCKET = 'org-branding'
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

async function assertOwner(orgId: string, userId: string) {
  const admin = getSupabaseAdmin()
  const { data: org } = await admin
    .from('organizations')
    .select('id, owner_id, logo_url')
    .eq('id', orgId)
    .single()
  if (!org) return { ok: false as const, status: 404, error: 'Organisation not found' }
  if (org.owner_id !== userId) return { ok: false as const, status: 403, error: 'Only the org owner can manage branding.' }
  return { ok: true as const, org }
}

// Best-effort cleanup of the org's previous logo. Files live at
// `<orgId>/logo.<ext>` so we attempt removal of every supported extension.
async function removeExistingLogos(orgId: string) {
  const admin = getSupabaseAdmin()
  const paths = Object.values(MIME_TO_EXT).map(ext => `${orgId}/logo.${ext}`)
  await admin.storage.from(BUCKET).remove(paths)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const auth = await assertOwner(orgId, user.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing `file` field (multipart/form-data).' }, { status: 400 })
    }

    const ext = MIME_TO_EXT[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: `Unsupported file type "${file.type || 'unknown'}". Use PNG, JPG, WebP, or SVG.` },
        { status: 415 }
      )
    }
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty.' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large (${Math.round(file.size / 1024)} KB). Max is 2 MB.` },
        { status: 413 }
      )
    }

    const admin = getSupabaseAdmin()
    // Wipe any prior logo extensions so a png→svg switch doesn't leave both.
    await removeExistingLogos(orgId)

    const objectPath = `${orgId}/logo.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadErr } = await admin.storage
      .from(BUCKET)
      .upload(objectPath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
        cacheControl: '60', // short cache so users see updates within a minute
      })
    if (uploadErr) {
      // Bucket-missing is the most common first-time failure — surface it
      // helpfully so the operator knows to apply the migration.
      const msg = uploadErr.message || ''
      if (/bucket.*not found|no such bucket/i.test(msg)) {
        return NextResponse.json(
          { error: 'Storage bucket "org-branding" is missing. Apply supabase-migrations/add_storage_org_branding.sql.' },
          { status: 500 }
        )
      }
      throw uploadErr
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(objectPath)
    // Append a cache-buster so the print page picks up the new file even if
    // the previous URL was the same (same orgId + same ext).
    const publicUrl = `${pub.publicUrl}?v=${Date.now()}`

    const { error: updateErr } = await admin
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('id', orgId)
    if (updateErr) throw updateErr

    return NextResponse.json({ logo_url: publicUrl, size: file.size, content_type: file.type })
  } catch (err) {
    await logError(err, { route: 'POST /api/orgs/[orgId]/branding/logo', userId: user.id, context: { orgId } })
    return NextResponse.json({ error: 'Logo upload failed.' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const auth = await assertOwner(orgId, user.id)
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

    await removeExistingLogos(orgId)

    const admin = getSupabaseAdmin()
    const { error } = await admin
      .from('organizations')
      .update({ logo_url: null })
      .eq('id', orgId)
    if (error) throw error

    return NextResponse.json({ logo_url: null })
  } catch (err) {
    await logError(err, { route: 'DELETE /api/orgs/[orgId]/branding/logo', userId: user.id, context: { orgId } })
    return NextResponse.json({ error: 'Failed to remove logo.' }, { status: 500 })
  }
}
