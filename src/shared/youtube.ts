/** Local encrypted storage state; does not assert YouTube accepts the session. */
export interface YouTubeSessionStatus {
  saved: boolean
  count: number
  savedAt: string | null
}
