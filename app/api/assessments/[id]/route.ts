import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ deleted: true })
  } catch (err) {
    console.error('Assessment delete error:', err instanceof Error ? err.stack : String(err))
    return NextResponse.json({ error: 'Failed to delete assessment. Please try again.' }, { status: 500 })
  }
}
