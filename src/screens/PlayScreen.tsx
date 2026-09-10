import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuitButton } from '../components/GameExit';
import { ColorCard } from '../components/ColorCard';
import { PlayField } from '../components/PlayField';
import { CARD_IDS, CARD_LABELS } from '../game/cards';
import { generateColor, rgbStyle } from '../game/colorEngine';
import { remainingSeconds } from '../game/session';
import { contains, moveCard, Point, Rect } from '../game/stack';
import { CardId, Question } from '../types/game';

type Props = { question: Question; playerName: string; questionNumber: number; questionCount: number;
  timeLimit: number | null; onAnswer: (recipe: readonly CardId[], timedOut: boolean) => void };

export function PlayScreen({ question, playerName, questionNumber, questionCount, timeLimit, onAnswer }: Props) {
  const compact = useWindowDimensions().height < 740;
  const [stack, setStack] = useState<CardId[]>([]);
  const [active, setActive] = useState<CardId | null>(null);
  const submitted = useRef(false);
  const stackRef = useRef(stack);
  const callback = useRef(onAnswer);
  callback.current = onAnswer;
  const deadline = useRef(timeLimit === null ? null : Date.now() + timeLimit * 1000);
  const [remaining, setRemaining] = useState(timeLimit);

  function updateStack(next: CardId[]) {
    stackRef.current = next;
    setStack(next);
  }
  function submit(timedOut: boolean) {
    if (submitted.current) return;
    submitted.current = true;
    const snapshot = [...stackRef.current];
    updateStack([]);
    setActive(null);
    callback.current(snapshot, timedOut);
  }
  useEffect(() => {
    if (deadline.current === null) return;
    const tick = () => {
      const seconds = remainingSeconds(deadline.current!, Date.now());
      setRemaining(seconds);
      if (seconds === 0) submit(true);
    };
    tick();
    const interval = setInterval(tick, 200);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') tick(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, []);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const handHeight = Math.min(178, size.height * 0.43);
  const field: Rect = { x: 12, y: 4, width: Math.max(0, size.width - 24), height: Math.max(0, size.height - handHeight - 16) };
  const hand: Rect = { x: 0, y: size.height - handHeight, width: size.width, height: handHeight };
  const cardWidth = Math.min(70, (size.width - 68) / 4);
  const cardHeight = Math.min(70, (handHeight - 34) / 2);
  const stackWidth = Math.min(160, size.width * 0.49);
  const step = Math.min(14, Math.max(4, (field.height - 76) / 12));
  const stackHeight = Math.max(48, field.height - 60 - 6 * step);

  function drop(id: CardId, center: Point | null) {
    if (submitted.current) return;
    if (deadline.current !== null && Date.now() >= deadline.current) { submit(true); return; }
    const destination = center && contains(hand, center) ? 'hand' : center && contains(field, center) ? 'field' : null;
    updateStack(moveCard(stackRef.current, id, destination));
    setActive(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={[styles.header, compact && { marginBottom: 8 }]}>
          <View style={{ flex: 1 }}><Text style={styles.title}>第{questionNumber}問 / {questionCount}問</Text><Text numberOfLines={1} style={styles.subtitle}>{playerName}さん</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>{remaining === null ? '時間無制限' : `残り ${remaining}秒`}</Text></View><QuitButton />
        </View>

        <View style={[styles.challenge, compact && { paddingVertical: 8 }]}>
          <View style={styles.targetInfo}><Text style={styles.eyebrow}>お題の色</Text><Text style={styles.colorName}>{question.name}<Text style={styles.reading}>  {question.reading}</Text></Text><Text style={styles.note}>この色に、近づけよう。</Text></View>
          <View style={styles.sampleColumn}><View testID="target-color" style={[styles.swatch, { backgroundColor: rgbStyle(generateColor(question.recipe)) }]} /><Text style={styles.sampleLabel}>お題</Text></View>
          <View style={styles.sampleColumn}><View testID="current-color" style={[styles.swatch, { backgroundColor: rgbStyle(generateColor(stack)) }]} /><Text style={styles.sampleLabel}>いまの色</Text></View>
        </View>

        <View style={[styles.status, compact && { height: 32 }]} accessibilityLiveRegion="polite">
          <Text style={styles.instruction}>カードを中央へ。戻すときは手札へ。</Text>
        </View>

        <View style={styles.board} onLayout={event => setSize(event.nativeEvent.layout)}>
          {size.width > 0 && <>
            <PlayField rect={field} count={stack.length} active={active !== null} />
            <View pointerEvents="none" testID="hand-area" style={[styles.hand, { top: hand.y, height: hand.height }]}><Text style={styles.handTitle}>手 札 <Text style={styles.handHint}>上端をつまんで、1枚ずつ</Text></Text></View>
            {CARD_IDS.map((id, i) => {
              const order = stack.indexOf(id);
              const placed = order >= 0;
              const row = i < 4 ? 0 : 1;
              const column = row === 0 ? i : i - 4;
              const columns = row === 0 ? 4 : 3;
              const position = placed
                ? { x: (size.width - stackWidth) / 2, y: field.y + 32 + order * step }
                : { x: (size.width - (columns * cardWidth + (columns - 1) * 10)) / 2 + column * (cardWidth + 10), y: hand.y + 27 + row * (cardHeight + 8) };
              return <ColorCard key={id} id={id} position={position} width={placed ? stackWidth : cardWidth} height={placed ? stackHeight : cardHeight} placed={placed} locked={active !== null && active !== id} zIndex={active === id ? 100 : placed ? order + 10 : 1} onStart={setActive} onDrop={drop} />;
            })}
          </>}
        </View>

        <Text testID="stack-order" style={styles.order} numberOfLines={1}>重ね順（下→上） {stack.length ? stack.map(id => CARD_LABELS[id]).join(' → ') : 'まだ重ねていません'}</Text>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={active !== null} onPress={() => { if (deadline.current !== null && Date.now() >= deadline.current) { submit(true); return; } if (!submitted.current) updateStack([]); }} style={({ pressed }) => [styles.reset, pressed && styles.pressed, active !== null && styles.disabled]}><Text style={styles.resetText}>リセット</Text></Pressable>
          <Pressable accessibilityRole="button" disabled={!stack.length || active !== null} onPress={() => submit(deadline.current !== null && Date.now() >= deadline.current)} style={({ pressed }) => [styles.submit, pressed && styles.pressed, (!stack.length || active !== null) && styles.disabled]}><Text style={styles.submitText}>この色で回答する</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F4EC' },
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, maxWidth: 520, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  title: { fontSize: 22, letterSpacing: 1, fontWeight: '600', color: '#2C483C' },
  subtitle: { fontSize: 10, color: '#858879', marginTop: 5, letterSpacing: 1 },
  badge: { alignItems: 'flex-end', gap: 5 },
  badgeText: { fontSize: 10, color: '#546854', letterSpacing: 1 },
  page: { fontSize: 10, color: '#989587' },
  challenge: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E3DFD2', paddingVertical: 14, gap: 12 },
  targetInfo: { flex: 1 },
  eyebrow: { fontSize: 10, color: '#7F8774', letterSpacing: 2 },
  colorName: { fontSize: 25, color: '#334735', marginTop: 4 },
  reading: { fontSize: 10, color: '#7D8372' },
  note: { fontSize: 10, color: '#898A7D', marginTop: 5 },
  sampleColumn: { alignItems: 'center', gap: 5 },
  swatch: { width: 49, height: 49, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  sampleLabel: { fontSize: 9, color: '#7F8878' },
  status: { height: 42, justifyContent: 'center', alignItems: 'center' },
  instruction: { fontSize: 11, color: '#7D8577' },
  result: { fontSize: 10, color: '#425E45' },
  score: { fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'] },
  board: { flex: 1, minHeight: 240 },
  hand: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderColor: '#DDDCCD' },
  handTitle: { fontSize: 11, color: '#53674F', marginTop: 7, textAlign: 'center' },
  handHint: { fontSize: 9, color: '#909281' },
  order: { fontSize: 9, color: '#7B8272', paddingVertical: 9, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  reset: { minHeight: 48, flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#CBD0C1', borderRadius: 14 },
  submit: { minHeight: 48, flex: 1.7, justifyContent: 'center', alignItems: 'center', backgroundColor: '#355746', borderRadius: 14 },
  resetText: { color: '#58654F', fontSize: 13 },
  submitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.38 },
});
