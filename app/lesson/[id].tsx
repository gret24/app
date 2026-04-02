import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Dimensions, PanResponder, Modal, Share, Alert, Linking,
  FlatList, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Colors } from '../../constants/Colors';
import { MOCK_LESSONS } from '../../data/mockData';
import Svg, { Path, Line, Circle, G, Polygon, Text as SvgText } from 'react-native-svg';
import { AVPlaybackStatus } from 'expo-av';
import { Video, ResizeMode } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

const { width: SCREEN_W } = Dimensions.get('window');
const VIDEO_H = Math.round(SCREEN_W * 9 / 16);

// ─────────────────────────────────────────────────────────────────────────────
// Drawing types
// ─────────────────────────────────────────────────────────────────────────────
type DrawTool = 'pen' | 'arrow' | 'circle' | 'line' | 'text';
interface Point { x: number; y: number }

interface PenElement    { id: string; tool: 'pen';    points: Point[]; color: string; sw: number }
interface LineElement   { id: string; tool: 'line';   x1: number; y1: number; x2: number; y2: number; color: string; sw: number }
interface ArrowElement  { id: string; tool: 'arrow';  x1: number; y1: number; x2: number; y2: number; color: string; sw: number }
interface CircleElement { id: string; tool: 'circle'; cx: number; cy: number; r: number;  color: string; sw: number }
interface TextElement   { id: string; tool: 'text';   x: number;  y: number;  text: string; color: string; sw: number }

type DrawElement = PenElement | LineElement | ArrowElement | CircleElement | TextElement;

const COLORS = ['#FF3B30', '#FFD700', '#007AFF', '#FFFFFF', '#34C759'];
const STROKE_WIDTHS = [2, 4, 6];
let idCounter = 0;
const uid = () => String(++idCounter);

function arrowHead(x1: number, y1: number, x2: number, y2: number, color: string): React.ReactElement {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 10;
  const a1 = angle + Math.PI * 0.8;
  const a2 = angle - Math.PI * 0.8;
  const pts = [
    x2, y2,
    x2 + size * Math.cos(a1), y2 + size * Math.sin(a1),
    x2 + size * Math.cos(a2), y2 + size * Math.sin(a2),
  ];
  return <Polygon points={pts.join(',')} fill={color} />;
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
      <SvgText
        key={el.id}
        x={el.x} y={el.y}
        fill={el.color}
        fontSize={el.sw * 4 + 10}
        fontWeight="700"
      >
        {el.text}
      </SvgText>
    );
  }
  // circle
  return <Circle key={el.id} cx={el.cx} cy={el.cy} r={el.r} stroke={el.color} strokeWidth={el.sw} fill="none" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawing Overlay
// ─────────────────────────────────────────────────────────────────────────────
interface DrawingOverlayProps {
  onDone: (captureViewRef: React.RefObject<View | null>) => void;
  onClose: () => void;
}

function DrawingOverlay({ onDone, onClose }: DrawingOverlayProps) {
  const [tool, setTool] = useState<DrawTool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [sw, setSw] = useState(4);
  const [elements, setElements] = useState<DrawElement[]>([]);
  const [redoStack, setRedoStack] = useState<DrawElement[]>([]);
  const [current, setCurrent] = useState<DrawElement | null>(null);

  // Text tool state
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingText, setPendingText] = useState('');

  // View ref for capture
  const captureViewRef = useRef<View>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX: x, locationY: y } = evt.nativeEvent;
        const id = uid();
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
          if (prev.tool === 'circle') return { ...prev, r: Math.hypot(x - prev.cx, y - prev.cy) };
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

  const toolRef  = useRef<DrawTool>('pen');
  const colorRef = useRef(COLORS[0]);
  const swRef    = useRef(4);

  const setToolSync  = (t: DrawTool) => { toolRef.current = t; setTool(t); };
  const setColorSync = (c: string)   => { colorRef.current = c; setColor(c); };
  const setSwSync    = (s: number)   => { swRef.current = s; setSw(s); };

  const undo = () => {
    setElements(els => {
      if (els.length === 0) return els;
      const last = els[els.length - 1];
      setRedoStack(r => [...r, last]);
      return els.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack(r => {
      if (r.length === 0) return r;
      const top = r[r.length - 1];
      setElements(els => [...els, top]);
      return r.slice(0, -1);
    });
  };

  const clear = () => { setElements([]); setRedoStack([]); };

  const confirmText = () => {
    if (pendingText.trim() && textPos) {
      const el: TextElement = {
        id: uid(),
        tool: 'text',
        x: textPos.x,
        y: textPos.y,
        text: pendingText.trim(),
        color: colorRef.current,
        sw: swRef.current,
      };
      setElements(els => [...els, el]);
      setRedoStack([]);
    }
    setShowTextInput(false);
    setTextPos(null);
    setPendingText('');
  };

  const toolIcons: Record<DrawTool, string> = {
    pen: '✏️', arrow: '➡️', circle: '⭕', line: '—', text: '𝐓',
  };

  return (
    <View style={draw.overlay}>
      {/* Capture area: canvas + watermark */}
      <View ref={captureViewRef} style={draw.captureArea} collapsable={false}>
        <View style={draw.canvas} {...panResponder.panHandlers}>
          <Svg width={SCREEN_W} height={VIDEO_H}>
            {elements.map(renderElement)}
            {current && renderElement(current)}
            {/* Watermark */}
            <SvgText
              x={SCREEN_W - 8}
              y={VIDEO_H - 8}
              fill="rgba(255,255,255,0.35)"
              fontSize={9}
              fontWeight="600"
              textAnchor="end"
            >
              IceIQ • iceiq.app
            </SvgText>
          </Svg>
        </View>
      </View>

      {/* Text input modal */}
      {showTextInput && (
        <View style={draw.textModal}>
          <View style={draw.textModalInner}>
            <Text style={draw.textModalLabel}>텍스트 입력</Text>
            <TextInput
              style={draw.textInput}
              value={pendingText}
              onChangeText={setPendingText}
              placeholder="텍스트를 입력하세요"
              placeholderTextColor={Colors.subtext}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={confirmText}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Pressable style={[draw.actionBtn, { flex: 1 }]} onPress={() => { setShowTextInput(false); setPendingText(''); }}>
                <Text style={draw.actionText}>취소</Text>
              </Pressable>
              <Pressable style={[draw.actionBtn, draw.doneBtn, { flex: 1 }]} onPress={confirmText}>
                <Text style={[draw.actionText, { color: Colors.bg, fontWeight: '700' }]}>확인</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Toolbar */}
      <View style={draw.toolbar}>
        {/* Tools */}
        <View style={draw.row}>
          {(['pen', 'arrow', 'circle', 'line', 'text'] as DrawTool[]).map(t => (
            <Pressable
              key={t}
              style={[draw.toolBtn, tool === t && draw.toolBtnActive]}
              onPress={() => setToolSync(t)}
            >
              <Text style={draw.toolIcon}>{toolIcons[t]}</Text>
            </Pressable>
          ))}
        </View>

        {/* Colors */}
        <View style={draw.row}>
          {COLORS.map(c => (
            <Pressable
              key={c}
              style={[draw.colorDot, { backgroundColor: c }, color === c && draw.colorDotActive]}
              onPress={() => setColorSync(c)}
            />
          ))}
        </View>

        {/* Stroke Width */}
        <View style={draw.row}>
          {STROKE_WIDTHS.map(s => (
            <Pressable
              key={s}
              style={[draw.swBtn, sw === s && draw.swBtnActive]}
              onPress={() => setSwSync(s)}
            >
              <View style={[draw.swLine, { height: s }]} />
            </Pressable>
          ))}
        </View>

        {/* Actions */}
        <View style={[draw.row, { gap: 6 }]}>
          <Pressable style={draw.actionBtn} onPress={undo}>
            <Text style={draw.actionText}>↩ Undo</Text>
          </Pressable>
          <Pressable style={[draw.actionBtn, redoStack.length === 0 && { opacity: 0.4 }]} onPress={redo}>
            <Text style={draw.actionText}>↪ Redo</Text>
          </Pressable>
          <Pressable style={draw.actionBtn} onPress={clear}>
            <Text style={draw.actionText}>Clear</Text>
          </Pressable>
          <Pressable style={[draw.actionBtn, draw.doneBtn]} onPress={() => onDone(captureViewRef)}>
            <Text style={[draw.actionText, { color: Colors.bg, fontWeight: '700' }]}>Done</Text>
          </Pressable>
          <Pressable style={draw.actionBtn} onPress={onClose}>
            <Text style={draw.actionText}>✕</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Share Modal
// ─────────────────────────────────────────────────────────────────────────────
const SHARE_MSG = '🏒 IceIQ로 분석한 하키 드로잉이에요!\n앱 다운로드: https://iceiq.app';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  capturedUri?: string | null;
}

function ShareModal({ visible, onClose, capturedUri }: ShareModalProps) {
  const shareOptions = [
    {
      icon: '📤',
      label: '공유하기 (시스템)',
      desc: '카카오톡, 메시지, 메일 등',
      color: Colors.accent,
      onPress: async () => {
        try {
          if (capturedUri && await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(capturedUri, { mimeType: 'image/png', dialogTitle: 'IceIQ 드로잉 공유' });
          } else {
            await Share.share({ message: SHARE_MSG, title: 'IceIQ 드로잉 공유' });
          }
        } catch (_) {}
        onClose();
      },
    },
    {
      icon: '💬',
      label: '카카오톡',
      desc: '카카오톡으로 전송',
      color: '#FEE500',
      onPress: async () => {
        const kakaoUrl = 'kakaolink://send?text=' + encodeURIComponent(SHARE_MSG);
        const canOpen = await Linking.canOpenURL(kakaoUrl);
        if (canOpen) { await Linking.openURL(kakaoUrl); }
        else { await Share.share({ message: SHARE_MSG }); }
        onClose();
      },
    },
    {
      icon: '✉️',
      label: '이메일',
      desc: '이메일로 전송',
      color: '#4488FF',
      onPress: async () => {
        const mailUrl = `mailto:?subject=${encodeURIComponent('IceIQ 하키 드로잉')}&body=${encodeURIComponent(SHARE_MSG)}`;
        try { await Linking.openURL(mailUrl); }
        catch { await Share.share({ message: SHARE_MSG }); }
        onClose();
      },
    },
    {
      icon: '💬',
      label: '문자 메시지',
      desc: 'SMS로 전송',
      color: '#00CC66',
      onPress: async () => {
        const smsUrl = `sms:?body=${encodeURIComponent(SHARE_MSG)}`;
        try { await Linking.openURL(smsUrl); }
        catch { await Share.share({ message: SHARE_MSG }); }
        onClose();
      },
    },
    {
      icon: '🖼️',
      label: '갤러리에 저장',
      desc: '이미지로 저장',
      color: '#FF6644',
      onPress: async () => {
        if (!capturedUri) { Alert.alert('오류', '캡처된 이미지가 없어요'); onClose(); return; }
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') { Alert.alert('권한 필요', '갤러리 권한이 필요해요'); onClose(); return; }
        await MediaLibrary.saveToLibraryAsync(capturedUri);
        Alert.alert('저장 완료', '드로잉이 갤러리에 저장되었어요! ✅');
        onClose();
      },
    },
    {
      icon: '🔗',
      label: '링크 복사',
      desc: '클립보드에 복사',
      color: Colors.subtext,
      onPress: () => { Alert.alert('복사 완료', '링크가 복사되었어요! 📋'); onClose(); },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={share.backdrop}>
        <View style={share.sheet}>
          <View style={share.sheetHeader}>
            <Text style={share.title}>✏️ 드로잉 공유</Text>
            <Pressable onPress={onClose} style={share.closeBtn}>
              <Text style={share.closeBtnText}>✕</Text>
            </Pressable>
          </View>
          <Text style={share.shareDesc}>드로잉이 포함된 캡처 화면을 공유해요</Text>
          <View style={share.optionGrid}>
            {shareOptions.map((opt, i) => (
              <Pressable key={i} style={share.optionCard} onPress={opt.onPress}>
                <View style={[share.optionIconBg, { backgroundColor: opt.color + '22' }]}>
                  <Text style={share.optionIcon}>{opt.icon}</Text>
                </View>
                <Text style={share.optionLabel}>{opt.label}</Text>
                <Text style={share.optionDesc}>{opt.desc}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={share.cancelBtn} onPress={onClose}>
            <Text style={share.cancelText}>취소</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upgrade Modal
// ─────────────────────────────────────────────────────────────────────────────
function UpgradeModal({ visible, onClose, onUpgrade }: { visible: boolean; onClose: () => void; onUpgrade: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={share.backdrop}>
        <View style={[share.sheet, { gap: 16 }]}>
          <Text style={{ fontSize: 40, textAlign: 'center' }}>🔒</Text>
          <Text style={[share.title, { textAlign: 'center' }]}>Pro Content</Text>
          <Text style={{ color: Colors.subtext, textAlign: 'center', lineHeight: 20 }}>
            Upgrade to Pro to unlock this lesson and get unlimited access to all premium content.
          </Text>
          <Pressable style={[share.option, { backgroundColor: Colors.accent, borderRadius: 12, justifyContent: 'center' }]} onPress={onUpgrade}>
            <Text style={[share.optionText, { color: Colors.bg, fontWeight: '700', textAlign: 'center' }]}>Upgrade to Pro</Text>
          </Pressable>
          <Pressable onPress={onClose}>
            <Text style={{ color: Colors.subtext, textAlign: 'center' }}>Maybe later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isPro, upgrade } = useSubscription();
  const lesson = MOCK_LESSONS.find(l => l.id === id);

  const [playing, setPlaying] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const videoRef = useRef<any>(null);
  const related = MOCK_LESSONS.filter(l => lesson?.relatedIds.includes(l.id));

  const handleDrawPress = () => { setPlaying(false); setShowDraw(true); };

  const handleDrawDone = useCallback(async (captureViewRef: React.RefObject<View | null>) => {
    try {
      const uri = await captureRef(captureViewRef as React.RefObject<View>, {
        format: 'png',
        quality: 0.9,
      });
      setCapturedUri(uri);
    } catch {
      setCapturedUri(null);
    }
    setShowDraw(false);
    setShowShare(true);
  }, []);

  if (!lesson) {
    return (
      <View style={s.notFound}>
        <Text style={s.notFoundText}>Lesson not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: Colors.accent, marginTop: 12 }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const locked = lesson.isPro && !isPro;

  if (locked) {
    return (
      <>
        <View style={s.root}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>
          <View style={s.lockedContainer}>
            <Text style={{ fontSize: 64 }}>🔒</Text>
            <Text style={s.lockedTitle}>{lesson.title}</Text>
            <Text style={s.lockedSub}>This is a Pro lesson. Upgrade to unlock.</Text>
            <Pressable style={s.upgradeBtn} onPress={() => setShowUpgrade(true)}>
              <Text style={s.upgradeBtnText}>Upgrade to Pro</Text>
            </Pressable>
          </View>
        </View>
        <UpgradeModal
          visible={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={async () => { await upgrade('pro'); setShowUpgrade(false); }}
        />
      </>
    );
  }

  return (
    <>
      <View style={s.root}>
        {/* Back button */}
        <View style={s.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={s.backText}>← Back</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Video Player */}
          <View style={s.videoContainer}>
            {lesson.type === 'youtube' ? (
              <YoutubePlayer
                height={VIDEO_H}
                width={SCREEN_W}
                videoId={lesson.videoId!}
                play={playing}
                onChangeState={(state: string) => {
                  if (state === 'playing') setPlaying(true);
                  if (state === 'paused' || state === 'ended') setPlaying(false);
                }}
              />
            ) : (
              <Video
                ref={videoRef}
                source={{ uri: lesson.videoUrl! }}
                style={{ width: SCREEN_W, height: VIDEO_H }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping={false}
                onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
                  if (status.isLoaded) setPlaying(status.isPlaying);
                }}
              />
            )}

            {showDraw && (
              <View style={StyleSheet.absoluteFill}>
                <DrawingOverlay
                  onDone={handleDrawDone}
                  onClose={() => setShowDraw(false)}
                />
              </View>
            )}
          </View>

          {/* Draw Button */}
          <View style={s.drawRow}>
            <Pressable style={s.drawBtn} onPress={handleDrawPress}>
              <Text style={s.drawBtnIcon}>✏️</Text>
              <Text style={s.drawBtnText}>Draw</Text>
            </Pressable>
          </View>

          {/* Lesson Info */}
          <View style={s.info}>
            <View style={s.tags}>
              <Text style={s.catTag}>{lesson.category}</Text>
              <View style={[s.diffBadge, {
                backgroundColor:
                  lesson.difficulty === 'Beginner' ? '#34C75933' :
                  lesson.difficulty === 'Intermediate' ? '#FFD70033' : '#FF3B3033'
              }]}>
                <Text style={[s.diffText, {
                  color: lesson.difficulty === 'Beginner' ? '#34C759' :
                         lesson.difficulty === 'Intermediate' ? '#FFD700' : '#FF3B30'
                }]}>{lesson.difficulty}</Text>
              </View>
              <Text style={s.duration}>⏱ {lesson.duration}</Text>
            </View>
            <Text style={s.title}>{lesson.title}</Text>
            <Text style={s.description}>{lesson.description}</Text>

            <View style={s.takeawaysCard}>
              <Text style={s.sectionTitle}>Key Takeaways</Text>
              {lesson.keyTakeaways.map((t, i) => (
                <View key={i} style={s.takeawayRow}>
                  <View style={s.takeawayDot} />
                  <Text style={s.takeawayText}>{t}</Text>
                </View>
              ))}
            </View>

            {related.length > 0 && (
              <View style={s.relatedSection}>
                <Text style={s.sectionTitle}>Related Lessons</Text>
                <FlatList
                  horizontal data={related}
                  keyExtractor={item => item.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                  renderItem={({ item }) => (
                    <Pressable
                      style={s.relatedCard}
                      onPress={() => router.replace(`/lesson/${item.id}` as any)}
                    >
                      <View style={s.relatedThumb}>
                        <Text style={{ fontSize: 28 }}>
                          {item.category === 'Skating' ? '⛸️' :
                           item.category === 'Shooting' ? '🏒' :
                           item.category === 'Defense' ? '🛡️' : '📹'}
                        </Text>
                        {item.isPro && !isPro && (
                          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000A', justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={{ fontSize: 18 }}>🔒</Text>
                          </View>
                        )}
                      </View>
                      <View style={{ padding: 10 }}>
                        <Text style={s.relatedCat}>{item.category}</Text>
                        <Text style={s.relatedTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={s.relatedDur}>{item.duration}</Text>
                      </View>
                    </Pressable>
                  )}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <ShareModal visible={showShare} onClose={() => setShowShare(false)} capturedUri={capturedUri} />
      <UpgradeModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        onUpgrade={async () => { await upgrade('pro'); setShowUpgrade(false); }}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  notFound: { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { color: Colors.text, fontSize: 18 },
  topBar: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 8 },
  backBtn: { paddingHorizontal: 20, paddingTop: 54, paddingBottom: 8 },
  backText: { color: Colors.accent, fontSize: 16, fontWeight: '600' },
  videoContainer: { width: SCREEN_W, height: VIDEO_H, backgroundColor: '#000', position: 'relative' },
  drawRow: {
    flexDirection: 'row', justifyContent: 'flex-end',
    paddingHorizontal: 20, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  drawBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  drawBtnIcon: { fontSize: 16 },
  drawBtnText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  info: { padding: 20, gap: 14 },
  tags: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  catTag: { fontSize: 12, color: Colors.accent, fontWeight: '700' },
  diffBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  diffText: { fontSize: 11, fontWeight: '700' },
  duration: { fontSize: 12, color: Colors.subtext, marginLeft: 'auto' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, lineHeight: 30 },
  description: { fontSize: 14, color: Colors.subtext, lineHeight: 22 },
  takeawaysCard: {
    backgroundColor: Colors.card,
    borderRadius: 14, padding: 18, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  takeawayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  takeawayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.accent, marginTop: 6 },
  takeawayText: { flex: 1, fontSize: 14, color: Colors.subtext, lineHeight: 20 },
  relatedSection: { gap: 12, marginBottom: 20 },
  relatedCard: { width: 160, backgroundColor: Colors.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  relatedThumb: { height: 90, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  relatedCat: { fontSize: 10, color: Colors.accent, fontWeight: '700' },
  relatedTitle: { fontSize: 12, fontWeight: '600', color: Colors.text, lineHeight: 16, marginTop: 2 },
  relatedDur: { fontSize: 11, color: Colors.subtext, marginTop: 4 },
  lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 16 },
  lockedTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  lockedSub: { fontSize: 14, color: Colors.subtext, textAlign: 'center' },
  upgradeBtn: { backgroundColor: Colors.accent, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  upgradeBtnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },
});

const draw = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent' },
  captureArea: { width: SCREEN_W, height: VIDEO_H },
  canvas: { width: SCREEN_W, height: VIDEO_H },
  toolbar: {
    backgroundColor: Colors.card + 'EE',
    padding: 10, gap: 8,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  toolBtn: {
    width: 40, height: 36, borderRadius: 8,
    backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  toolBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  toolIcon: { fontSize: 14 },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: Colors.text, transform: [{ scale: 1.15 }] },
  swBtn: { width: 40, height: 36, borderRadius: 8, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  swBtnActive: { borderColor: Colors.accent },
  swLine: { width: 24, backgroundColor: Colors.text, borderRadius: 2 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border },
  doneBtn: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  actionText: { fontSize: 12, color: Colors.text, fontWeight: '600' },
  // Text input modal
  textModal: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center', padding: 24 },
  textModalInner: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, width: '100%', gap: 8 },
  textModalLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  textInput: { height: 44, backgroundColor: Colors.input, borderRadius: 10, paddingHorizontal: 12, color: Colors.text, fontSize: 14, borderWidth: 1, borderColor: Colors.border },
});

const share = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 44, gap: 12 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.input, justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { fontSize: 14, color: Colors.subtext },
  shareDesc: { fontSize: 13, color: Colors.subtext, marginBottom: 4 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard: { width: '30%', alignItems: 'center', gap: 6, padding: 10, borderRadius: 14, backgroundColor: Colors.input, borderWidth: 1, borderColor: Colors.border },
  optionIconBg: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  optionIcon: { fontSize: 22 },
  optionLabel: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  optionDesc: { fontSize: 9, color: Colors.subtext, textAlign: 'center' },
  cancelBtn: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  cancelText: { color: Colors.subtext, fontSize: 15 },
  optionText: { fontSize: 16, color: Colors.text },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  cancelOption: { borderBottomWidth: 0 },
});
