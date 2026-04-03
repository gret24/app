import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, PanResponder,
  Alert, Modal, TextInput, Linking, Share,
} from 'react-native';
import Svg, {
  Path, Line, Circle, G, Polygon, Text as SvgText,
} from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import * as SharingLib from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { Colors } from '../constants/Colors';

// ─── Types ────────────────────────────────────────────────────────────────────
export type DrawTool = 'pen' | 'arrow' | 'circle' | 'line' | 'text';
interface Point { x: number; y: number }
interface PenElement    { id: string; tool: 'pen';    points: Point[]; color: string; sw: number }
interface LineElement   { id: string; tool: 'line';   x1: number; y1: number; x2: number; y2: number; color: string; sw: number }
interface ArrowElement  { id: string; tool: 'arrow';  x1: number; y1: number; x2: number; y2: number; color: string; sw: number }
interface CircleElement { id: string; tool: 'circle'; cx: number; cy: number; r: number; color: string; sw: number }
interface TextElement   { id: string; tool: 'text';   x: number; y: number; text: string; color: string; sw: number }
type DrawElement = PenElement | LineElement | ArrowElement | CircleElement | TextElement;

export const DRAW_COLORS = ['#FF3B30', '#FFD700', '#007AFF', '#FFFFFF', '#34C759', '#FF9500'];
export const STROKE_WIDTHS = [2, 4, 6];

let _id = 0;
const nextId = () => String(++_id);

function arrowHead(x1: number, y1: number, x2: number, y2: number, color: string) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 10;
  const pts = [
    x2, y2,
    x2 + size * Math.cos(angle + 2.4), y2 + size * Math.sin(angle + 2.4),
    x2 + size * Math.cos(angle - 2.4), y2 + size * Math.sin(angle - 2.4),
  ];
  return <Polygon key="head" points={pts.join(',')} fill={color} />;
}

function renderElement(el: DrawElement): React.ReactElement {
  if (el.tool === 'pen') {
    const d = el.points.reduce((acc, p, i) =>
      i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
    return <Path key={el.id} d={d} stroke={el.color} strokeWidth={el.sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (el.tool === 'line') {
    return <Line key={el.id} x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={el.color} strokeWidth={el.sw} strokeLinecap="round" />;
  }
  if (el.tool === 'arrow') {
    return (
      <G key={el.id}>
        <Line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={el.color} strokeWidth={el.sw} strokeLinecap="round" />
        {arrowHead(el.x1, el.y1, el.x2, el.y2, el.color)}
      </G>
    );
  }
  if (el.tool === 'text') {
    return (
      <SvgText key={el.id} x={el.x} y={el.y} fill={el.color} fontSize={el.sw * 4 + 10} fontWeight="700">
        {el.text}
      </SvgText>
    );
  }
  // circle
  return <Circle key={el.id} cx={(el as CircleElement).cx} cy={(el as CircleElement).cy} r={(el as CircleElement).r} stroke={el.color} strokeWidth={el.sw} fill="none" />;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  width: number;
  height: number;
  /** Optional: if provided, called instead of showing built-in share modal */
  onShare?: (uri: string) => void;
  /** Called when user dismisses the overlay (Clear & Close or ✕) */
  onClose: () => void;
  /** Called when user taps "Continue" after Done */
  onContinue?: () => void;
}

const SHARE_MSG = '🏒 IceIQ로 분석한 하키 드로잉이에요!\n앱 다운로드: https://iceiq.app';

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DrawingOverlay({ visible, width, height, onClose, onContinue }: Props) {
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [sw, setSw] = useState(4);
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [redoStack, setRedoStack] = useState<DrawElement[]>([]);
  const [current, setCurrent] = useState<DrawElement | null>(null);
  const [textPos, setTextPos] = useState<Point | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingText, setPendingText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const captureRef2 = useRef<View>(null);
  const toolRef = useRef<DrawTool>('pen');
  const colorRef = useRef(DRAW_COLORS[0]);
  const swRef = useRef(4);

  const setToolSync  = (t: DrawTool) => { toolRef.current = t; setTool(t); };
  const setColorSync = (c: string)   => { colorRef.current = c; setColor(c); };
  const setSwSync    = (s: number)   => { swRef.current = s; setSw(s); };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        const id = nextId();
        const t = toolRef.current;
        const c = colorRef.current;
        const s = swRef.current;
        if (t === 'text') {
          setTextPos({ x, y });
          setPendingText('');
          setShowTextInput(true);
          return;
        }
        setCurrent(() => {
          if (t === 'pen')    return { id, tool: 'pen', points: [{ x, y }], color: c, sw: s };
          if (t === 'line')   return { id, tool: 'line',   x1: x, y1: y, x2: x, y2: y, color: c, sw: s };
          if (t === 'arrow')  return { id, tool: 'arrow',  x1: x, y1: y, x2: x, y2: y, color: c, sw: s };
          if (t === 'circle') return { id, tool: 'circle', cx: x, cy: y, r: 0,   color: c, sw: s };
          return null;
        });
      },
      onPanResponderMove: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        setCurrent(prev => {
          if (!prev) return prev;
          if (prev.tool === 'pen')    return { ...prev, points: [...prev.points, { x, y }] };
          if (prev.tool === 'line')   return { ...prev, x2: x, y2: y };
          if (prev.tool === 'arrow')  return { ...prev, x2: x, y2: y };
          if (prev.tool === 'circle') return { ...prev, r: Math.hypot(x - (prev as CircleElement).cx, y - (prev as CircleElement).cy) };
          return prev;
        });
      },
      onPanResponderRelease: () => {
        setCurrent(prev => {
          if (prev) {
            setElements(els => [...els, prev]);
            setRedoStack([]);
          }
          return null;
        });
      },
    })
  ).current;

  const undo = () => {
    setElements(els => {
      if (!els.length) return els;
      setRedoStack(r => [...r, els[els.length - 1]]);
      return els.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack(r => {
      if (!r.length) return r;
      const top = r[r.length - 1];
      setElements(els => [...els, top]);
      return r.slice(0, -1);
    });
  };

  const clear = () => { setElements([]); setRedoStack([]); };

  const confirmText = () => {
    if (pendingText.trim() && textPos) {
      setElements(els => [...els, {
        id: nextId(), tool: 'text',
        x: textPos.x, y: textPos.y,
        text: pendingText.trim(),
        color: colorRef.current, sw: swRef.current,
      }]);
      setRedoStack([]);
    }
    setShowTextInput(false); setTextPos(null); setPendingText('');
  };

  const handleDone = async () => {
    try {
      const uri = await captureRef(captureRef2, { format: 'png', quality: 0.95 });
      setCapturedUri(uri);
      setShowShareModal(true);
    } catch {
      Alert.alert('캡처 실패', '화면을 캡처할 수 없어요.');
    }
  };

  const toolIcons: Record<DrawTool, string> = {
    pen: '✏️', arrow: '➡️', circle: '⭕', line: '—', text: '𝐓',
  };

  if (!visible) return null;

  return (
    <View style={[s.container, { width, height }]}>
      {/* Canvas + watermark */}
      <View ref={captureRef2} style={[s.captureArea, { width, height }]} collapsable={false}>
        <View style={{ width, height }} {...panResponder.panHandlers}>
          <Svg width={width} height={height}>
            {elements.map(renderElement)}
            {current && renderElement(current)}
            <SvgText
              x={width - 8} y={height - 8}
              fill="rgba(255,255,255,0.35)"
              fontSize={9} fontWeight="600" textAnchor="end"
            >
              IceIQ • iceiq.app
            </SvgText>
          </Svg>
        </View>
      </View>

      {/* Text input popup */}
      {showTextInput && (
        <View style={s.textModal}>
          <View style={s.textModalInner}>
            <Text style={s.textModalLabel}>텍스트 입력</Text>
            <TextInput
              style={s.textInput}
              value={pendingText}
              onChangeText={setPendingText}
              placeholder="텍스트를 입력하세요"
              placeholderTextColor={Colors.subtext}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmText}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Pressable style={[s.actionBtn, { flex: 1 }]} onPress={() => { setShowTextInput(false); setPendingText(''); }}>
                <Text style={s.actionText}>취소</Text>
              </Pressable>
              <Pressable style={[s.actionBtn, s.doneBtn, { flex: 1 }]} onPress={confirmText}>
                <Text style={[s.actionText, { color: Colors.bg, fontWeight: '700' }]}>확인</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Toolbar */}
      <View style={s.toolbar}>
        {/* Tools */}
        <View style={s.row}>
          {(['pen', 'arrow', 'circle', 'line', 'text'] as DrawTool[]).map(t => (
            <Pressable key={t} style={[s.toolBtn, tool === t && s.toolBtnActive]} onPress={() => setToolSync(t)}>
              <Text style={s.toolIcon}>{toolIcons[t]}</Text>
            </Pressable>
          ))}
        </View>
        {/* Colors */}
        <View style={s.row}>
          {DRAW_COLORS.map(c => (
            <Pressable key={c} style={[s.colorDot, { backgroundColor: c }, color === c && s.colorDotActive]} onPress={() => setColorSync(c)} />
          ))}
        </View>
        {/* Stroke */}
        <View style={s.row}>
          {STROKE_WIDTHS.map(sw2 => (
            <Pressable key={sw2} style={[s.swBtn, sw === sw2 && s.swBtnActive]} onPress={() => setSwSync(sw2)}>
              <View style={[s.swLine, { height: sw2 }]} />
            </Pressable>
          ))}
        </View>
        {/* Actions */}
        <View style={[s.row, { gap: 6 }]}>
          <Pressable style={s.actionBtn} onPress={undo}><Text style={s.actionText}>↩ Undo</Text></Pressable>
          <Pressable style={[s.actionBtn, redoStack.length === 0 && { opacity: 0.4 }]} onPress={redo}><Text style={s.actionText}>↪ Redo</Text></Pressable>
          <Pressable style={s.actionBtn} onPress={clear}><Text style={s.actionText}>Clear</Text></Pressable>
          <Pressable style={[s.actionBtn, s.doneBtn]} onPress={handleDone}><Text style={[s.actionText, { color: Colors.bg, fontWeight: '700' }]}>Done</Text></Pressable>
          <Pressable style={s.actionBtn} onPress={onClose}><Text style={s.actionText}>✕</Text></Pressable>
        </View>
      </View>

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="slide" onRequestClose={() => setShowShareModal(false)}>
        <View style={s.shareBackdrop}>
          <View style={s.shareSheet}>
            <Text style={s.shareTitle}>드로잉 공유</Text>
            {[
              {
                icon: '📤', label: '공유하기 (시스템)', desc: '카카오톡, 메시지, 메일 등',
                color: Colors.accent,
                onPress: async () => {
                  try {
                    if (capturedUri && await SharingLib.isAvailableAsync()) {
                      await SharingLib.shareAsync(capturedUri, { mimeType: 'image/png', dialogTitle: 'IceIQ 드로잉 공유' });
                    } else {
                      await Share.share({ message: SHARE_MSG });
                    }
                  } catch (_) {}
                  setShowShareModal(false);
                },
              },
              {
                icon: '🖼️', label: '갤러리에 저장', desc: '이미지로 저장',
                color: '#FF6644',
                onPress: async () => {
                  if (!capturedUri) { Alert.alert('오류', '캡처된 이미지가 없어요'); setShowShareModal(false); return; }
                  const { status } = await MediaLibrary.requestPermissionsAsync();
                  if (status !== 'granted') { Alert.alert('권한 필요', '갤러리 권한이 필요해요'); setShowShareModal(false); return; }
                  await MediaLibrary.saveToLibraryAsync(capturedUri);
                  Alert.alert('저장 완료', '드로잉이 갤러리에 저장되었어요! ✅');
                  setShowShareModal(false);
                },
              },
            ].map((opt, i) => (
              <Pressable key={i} style={s.shareOption} onPress={opt.onPress}>
                <View style={[s.shareIconWrap, { backgroundColor: opt.color + '22' }]}>
                  <Text style={s.shareIcon}>{opt.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.shareLabel}>{opt.label}</Text>
                  <Text style={s.shareDesc}>{opt.desc}</Text>
                </View>
              </Pressable>
            ))}
            {onContinue && (
              <Pressable style={[s.shareOption, { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 16 }]}
                onPress={() => { setShowShareModal(false); onContinue(); }}>
                <View style={[s.shareIconWrap, { backgroundColor: '#34C75922' }]}>
                  <Text style={s.shareIcon}>▶</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.shareLabel}>계속 재생</Text>
                  <Text style={s.shareDesc}>드로잉 유지하고 영상 재생 재개</Text>
                </View>
              </Pressable>
            )}
            <Pressable style={s.cancelBtn} onPress={() => setShowShareModal(false)}>
              <Text style={s.cancelBtnText}>취소</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0,
    zIndex: 100,
  },
  captureArea: {
    position: 'absolute',
    top: 0, left: 0,
  },
  toolbar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(10,10,15,0.92)',
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolBtn: {
    width: 38, height: 38,
    borderRadius: 10,
    backgroundColor: '#1e2a3a',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2e4a6a',
  },
  toolBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  toolIcon: { fontSize: 16 },
  colorDot: {
    width: 26, height: 26,
    borderRadius: 13,
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotActive: {
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
  },
  swBtn: {
    width: 36, height: 28,
    borderRadius: 8,
    backgroundColor: '#1e2a3a',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2e4a6a',
  },
  swBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  swLine: {
    width: 18, borderRadius: 2,
    backgroundColor: '#fff',
  },
  actionBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e2a3a',
    borderWidth: 1, borderColor: '#2e4a6a',
  },
  doneBtn: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  actionText: { fontSize: 12, color: '#a0c8e8', fontWeight: '600' },
  textModal: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center',
    padding: 24,
    zIndex: 200,
  },
  textModalInner: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 20, width: '100%', gap: 8,
  },
  textModalLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  textInput: {
    backgroundColor: Colors.input, borderRadius: 10, padding: 12,
    color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border,
  },
  // Share modal
  shareBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  shareSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 4,
  },
  shareTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  shareOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12,
  },
  shareIconWrap: {
    width: 46, height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  shareIcon: { fontSize: 22 },
  shareLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  shareDesc: { fontSize: 12, color: Colors.subtext, marginTop: 2 },
  cancelBtn: {
    height: 48, borderRadius: 12, backgroundColor: Colors.input,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  cancelBtnText: { fontSize: 15, color: Colors.subtext, fontWeight: '600' },
});
