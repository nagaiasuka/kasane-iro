import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Screen, ui } from '../components/Screen';
import { QuitButton } from '../components/GameExit';
import { ResultComparison } from '../components/ResultComparison';
import { GameSession } from '../types/game';

export function QuestionResultScreen({ session, onNext }: { session: GameSession; onNext: () => void }) {
  const { width, fontScale } = useWindowDimensions();
  const last = session.currentQuestionIndex === session.questions.length - 1;
  const title = `第${session.currentQuestionIndex + 1}問の結果`;
  const footer = <Button label={last ? '最終結果を見る' : '次の問題へ'} onPress={onNext} />;
  // Keep readable text and a reachable button when accessibility text needs extra height.
  if (fontScale > 1.4) return <Screen compact title={title}>
    <ResultComparison session={session} question={session.currentQuestion} detailed />{footer}
  </Screen>;
  const padding = Math.max(10, Math.min(16, width / 30));
  return <SafeAreaView style={ui.safe}>
    <View style={[styles.screen, { padding, gap: padding }]}>
      <View testID="result-header">
        <View style={styles.row}><Text style={ui.brand}>かさねいろ</Text><QuitButton /></View>
        <View style={styles.row}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.question}>{session.currentQuestion.name}<Text style={styles.reading}>　{session.currentQuestion.reading}</Text></Text>
        </View>
      </View>
      <ResultComparison session={session} question={session.currentQuestion} fill />
      <View testID="result-footer">{footer}</View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: '100%', maxWidth: 640, alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 18, lineHeight: 26, fontWeight: '600', color: '#2C483C' },
  question: { fontSize: 15, color: '#334735', flexShrink: 1 },
  reading: { fontSize: 10, color: '#7D8372' },
});
