/**
 * World palette — flat ground layers drawn under the sprite art.
 * Colours sampled to sit under the sprite plinths (light paving, fresh lawns,
 * slate roads) so sprites read as part of one diorama.
 */
export const world = {
  skyTop: '#9cc7ee',
  skyBottom: '#e6f0fa',
  farBank: '#bcd8a8',
  river: ['#7cc0ec', '#4f9fd8'],
  boardTop: '#eef0f2',
  boardEdge: '#c9ced8',
  boardEdgeDark: '#aab1bf',
  lawn: '#9fd16f',
  lawnEdge: '#7fb85a',
  road: '#5d6677',
  roadEdge: '#e9ecef',
  roadLine: '#f6f6f2',
  plaza: '#f6f4ef',
} as const
