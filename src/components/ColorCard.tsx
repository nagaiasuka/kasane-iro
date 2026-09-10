import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text } from 'react-native';
import { cardStyle } from '../game/colorEngine';
import { CARD_LABELS } from '../game/cards';
import { Point } from '../game/stack';
import { CardId } from '../types/game';

type Props = {
  id: CardId; position: Point; width: number; height: number; zIndex: number;
  placed: boolean; locked: boolean;
  testID?: string;
  onStart: (id: CardId) => void;
  onDrop: (id: CardId, center: Point | null) => void;
};

export function ColorCard(props: Props) {
  const latest = useRef(props);
  latest.current = props;
  const xy = useRef(new Animated.ValueXY(props.position)).current;
  const origin = useRef(props.position);
  const [dragging, setDragging] = useState(false);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !latest.current.locked,
    onMoveShouldSetPanResponder: () => !latest.current.locked,
    onPanResponderGrant: () => {
      xy.stopAnimation();
      origin.current = latest.current.position;
      xy.setValue(origin.current);
      setDragging(true);
      latest.current.onStart(latest.current.id);
    },
    onPanResponderMove: (_, gesture) => {
      xy.setValue({ x: origin.current.x + gesture.dx, y: origin.current.y + gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      const p = latest.current;
      p.onDrop(p.id, { x: origin.current.x + gesture.dx + p.width / 2, y: origin.current.y + gesture.dy + p.height / 2 });
      setDragging(false);
    },
    onPanResponderTerminate: () => {
      latest.current.onDrop(latest.current.id, null);
      setDragging(false);
    },
    onPanResponderTerminationRequest: () => true,
  }), [xy]);

  useEffect(() => {
    if (!dragging) {
      const animation = Animated.spring(xy, {
        toValue: props.position, useNativeDriver: false, friction: 9, tension: 85,
      });
      animation.start();
      return () => animation.stop();
    }
  }, [props.position.x, props.position.y, dragging, xy]);

  return (
    <Animated.View
      {...responder.panHandlers}
      testID={props.testID ?? `card-${props.id}`}
      accessible accessibilityLabel={`${CARD_LABELS[props.id]}、${props.placed ? '場' : '手札'}のカード`}
      accessibilityHint={props.locked ? undefined : '中央へドラッグして重ね、下へドラッグして戻します'}
      style={[styles.card, {
        width: props.width, height: props.height, backgroundColor: cardStyle(props.id),
        zIndex: props.zIndex, transform: xy.getTranslateTransform(),
        borderColor: dragging ? '#314940' : 'rgba(38, 56, 48, 0.24)',
      }]}
    >
      <Text style={styles.label}>{CARD_LABELS[props.id]}</Text>
      {!props.placed && <Text style={styles.mark}>かさねいろ</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', top: 0, left: 0, borderWidth: 1, borderRadius: 9 },
  label: { fontSize: 11, fontWeight: '700', color: '#253E37', marginLeft: 9, marginTop: 2 },
  mark: { position: 'absolute', bottom: 9, alignSelf: 'center', fontSize: 8, color: '#354A42', letterSpacing: 1 },
});
