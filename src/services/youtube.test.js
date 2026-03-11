import { describe, expect, it, vi } from 'vitest'
import {
  extractYouTubeVideoId,
  fetchYouTubeTranscript,
  parseTranscriptPayload,
  YOUTUBE_FALLBACK_MESSAGE,
} from './youtube.js'

describe('youtube service', () => {
  it('extracts the video id from supported YouTube URLs', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYouTubeVideoId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull()
  })

  it('parses transcript payloads into normalized text', () => {
    expect(
      parseTranscriptPayload({
        events: [
          { segs: [{ utf8: 'Hello' }, { utf8: '&amp; welcome' }] },
          { segs: [{ utf8: 'to the test.' }] },
        ],
      }),
    ).toBe('Hello & welcome to the test.')
  })

  it('returns the first successful transcript response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ events: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [{ segs: [{ utf8: 'Transcript line one.' }, { utf8: 'Transcript line two.' }] }],
        }),
      })

    const result = await fetchYouTubeTranscript('https://youtu.be/dQw4w9WgXcQ', fetchMock)

    expect(result.videoId).toBe('dQw4w9WgXcQ')
    expect(result.language).toBe('en-US')
    expect(result.text).toContain('Transcript line one.')
  })

  it('throws the PRD fallback message when there is no caption track', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ events: [] }),
    })

    await expect(fetchYouTubeTranscript('https://youtu.be/dQw4w9WgXcQ', fetchMock)).rejects.toThrow(
      YOUTUBE_FALLBACK_MESSAGE,
    )
  })
})
