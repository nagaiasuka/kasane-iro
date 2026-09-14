import { GameSession } from '../types/game';

export type ScreenName = 'title' | 'howTo' | 'stages' | 'settings' | 'players' | 'game';
export function backAction(screen: ScreenName, status?: GameSession['gameStatus'], hasDetail = false) {
  switch (screen) {
    case 'title': return 'system';
    case 'howTo':
    case 'stages': return 'title';
    case 'settings': return 'stages';
    case 'players': return 'settings';
    case 'game': return status === 'finished' ? (hasDetail ? 'result' : 'title') : 'confirmExit';
  }
}
