import { NextRequest, NextResponse } from 'next/server'

interface TenorGif {
  id: string
  title: string
  media_formats: {
    gif: {
      url: string
      dims: [number, number]
    }
    tinygif: {
      url: string
      dims: [number, number]
    }
  }
}

interface GifData {
  id: string
  title: string
  url: string
  preview: string
  width: number
  height: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const apiKey = process.env.TENOR_API_KEY
    if (!apiKey) {
      console.error('TENOR_API_KEY not configured')
      return NextResponse.json({ error: 'GIF service not configured' }, { status: 500 })
    }

    // Search GIFs from Tenor
    const response = await fetch(
      `https://tenor.googleapis.com/v2/search?key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&media_filter=gif,tinygif`
    )

    if (!response.ok) {
      console.error('Tenor API error:', response.status, response.statusText)
      return NextResponse.json({ error: 'Failed to search GIFs' }, { status: 500 })
    }

    const data = await response.json()

    // Transform Tenor response to our format
    const gifs: GifData[] = data.results?.map((gif: TenorGif) => ({
      id: gif.id,
      title: gif.title || 'GIF',
      url: gif.media_formats.gif.url,
      preview: gif.media_formats.tinygif?.url || gif.media_formats.gif.url,
      width: gif.media_formats.gif.dims[0],
      height: gif.media_formats.gif.dims[1]
    })) || []

    return NextResponse.json({ gifs })
  } catch (error) {
    console.error('Error searching GIFs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
