import { useState, useRef } from "react";
import {
  View, Text, Modal, Pressable, Image, PanResponder, Dimensions, StyleSheet, ScrollView
} from "react-native";
import { Colors } from "../constants/Colors";

const { width: SW } = Dimensions.get("window");

interface BenchBox { x_min: number; y_min: number; x_max: number; y_max: number; }
export interface BenchConfig {
  preset?: string;
  home_bench?: BenchBox;
  away_bench?: BenchBox;
}

interface Props {
  visible: boolean;
  frameUri?: string;
  frameW?: number;
  frameH?: number;
  onDone: (config: BenchConfig | null) => void;
  onSkip: () => void;
}

export default function BenchSetupScreen({ visible, frameUri, frameW = 1280, frameH = 720, onDone, onSkip }: Props) {
  const [step, setStep] = useState<"home"|"away">("home");
  const [homeBox, setHomeBox] = useState<BenchBox | null>(null);
  const [awayBox, setAwayBox] = useState<BenchBox | null>(null);
  const [dragging, setDragging] = useState<{sx:number;sy:number;ex:number;ey:number} | null>(null);
  const containerRef = useRef<View>(null);

  // 화면 표시 크기
  const dispW = SW - 32;
  const dispH = dispW * (frameH / frameW);
  const scaleX = frameW / dispW;
  const scaleY = frameH / dispH;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      setDragging({ sx: locationX, sy: locationY, ex: locationX, ey: locationY });
    },
    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      setDragging(prev => prev ? { ...prev, ex: locationX, ey: locationY } : null);
    },
    onPanResponderRelease: () => {
      if (!dragging) return;
      const box: BenchBox = {
        x_min: Math.round(Math.min(dragging.sx, dragging.ex) * scaleX),
        y_min: Math.round(Math.min(dragging.sy, dragging.ey) * scaleY),
        x_max: Math.round(Math.max(dragging.sx, dragging.ex) * scaleX),
        y_max: Math.round(Math.max(dragging.sy, dragging.ey) * scaleY),
      };
      if (step === "home") { setHomeBox(box); setStep("away"); }
      else { setAwayBox(box); }
      setDragging(null);
    },
  });

  const applyPreset = (preset: string) => {
    onDone({ preset });
  };

  const handleDone = () => {
    if (homeBox && awayBox) {
      onDone({ home_bench: homeBox, away_bench: awayBox });
    } else if (homeBox) {
      onDone({ home_bench: homeBox });
    }
  };

  const rectStyle = (box: {sx:number;sy:number;ex:number;ey:number}, color: string) => ({
    position: "absolute" as const,
    left: Math.min(box.sx, box.ex),
    top: Math.min(box.sy, box.ey),
    width: Math.abs(box.ex - box.sx),
    height: Math.abs(box.ey - box.sy),
    borderWidth: 2,
    borderColor: color,
    backgroundColor: color + "33",
  });

  const boxToDisp = (b: BenchBox) => ({
    sx: b.x_min / scaleX, sy: b.y_min / scaleY,
    ex: b.x_max / scaleX, ey: b.y_max / scaleY,
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onSkip}>
      <View style={s.root}>
        <View style={s.header}>
          <Text style={s.title}>🏒 벤치 위치 지정</Text>
          <Pressable onPress={onSkip}><Text style={s.skip}>건너뛰기</Text></Pressable>
        </View>

        <ScrollView contentContainerStyle={s.content}>
          {/* 안내 */}
          <View style={s.infoBox}>
            <Text style={s.infoText}>
              {step === "home"
                ? "🏠 홈팀 벤치 영역을 드래그해서 지정하세요\n선수들이 나가고 들어오는 가장자리 영역"
                : "✈️ 어웨이팀 벤치 영역을 드래그해서 지정하세요"}
            </Text>
          </View>

          {/* 프리셋 버튼 */}
          <Text style={s.presetLabel}>빠른 선택:</Text>
          <View style={s.presetRow}>
            {[
              { label: "⬆️ 상단", value: "top" },
              { label: "⬇️ 하단", value: "bottom" },
              { label: "⬅️ 좌측", value: "left" },
              { label: "➡️ 우측", value: "right" },
            ].map(p => (
              <Pressable key={p.value} style={s.presetBtn} onPress={() => applyPreset(p.value)}>
                <Text style={s.presetBtnText}>{p.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* 영상 프레임 + 드래그 영역 */}
          <View style={[s.frameContainer, { width: dispW, height: dispH }]}
                {...panResponder.panHandlers}>
            {frameUri ? (
              <Image source={{ uri: frameUri }} style={{ width: dispW, height: dispH }} resizeMode="contain" />
            ) : (
              <View style={[s.framePlaceholder, { width: dispW, height: dispH }]}>
                <Text style={s.framePlaceholderText}>프레임 로딩 중...</Text>
              </View>
            )}
            {/* 드래그 중 사각형 */}
            {dragging && (
              <View style={rectStyle(dragging, step === "home" ? Colors.accent : "#FF3B30")} />
            )}
            {/* 홈 박스 */}
            {homeBox && (
              <View style={rectStyle(boxToDisp(homeBox), Colors.accent)}>
                <Text style={{ color: Colors.accent, fontSize: 10, padding: 2 }}>홈</Text>
              </View>
            )}
            {/* 어웨이 박스 */}
            {awayBox && (
              <View style={rectStyle(boxToDisp(awayBox), "#FF3B30")}>
                <Text style={{ color: "#FF3B30", fontSize: 10, padding: 2 }}>어웨이</Text>
              </View>
            )}
          </View>

          <Text style={s.hint}>
            💡 벤치가 화면에 안 보이면 선수들이 사라지는 가장자리를 지정하세요
          </Text>

          {/* 완료/재설정 */}
          <View style={s.btnRow}>
            <Pressable style={s.resetBtn} onPress={() => { setHomeBox(null); setAwayBox(null); setStep("home"); }}>
              <Text style={s.resetBtnText}>초기화</Text>
            </Pressable>
            <Pressable
              style={[s.doneBtn, !homeBox && s.doneBtnDisabled]}
              onPress={handleDone}
              disabled={!homeBox}>
              <Text style={s.doneBtnText}>
                {awayBox ? "완료" : homeBox ? "어웨이도 지정" : "홈팀 먼저 지정"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
            paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: "800", color: Colors.text },
  skip: { color: Colors.subtext, fontSize: 14 },
  content: { padding: 16, gap: 12 },
  infoBox: { backgroundColor: Colors.card, borderRadius: 12, padding: 14,
             borderWidth: 1, borderColor: Colors.border },
  infoText: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  presetLabel: { color: Colors.subtext, fontSize: 13, fontWeight: "600" },
  presetRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  presetBtn: { backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 16,
               paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  presetBtnText: { color: Colors.text, fontSize: 13, fontWeight: "600" },
  frameContainer: { borderRadius: 12, overflow: "hidden", position: "relative",
                    borderWidth: 1, borderColor: Colors.border, alignSelf: "center" },
  framePlaceholder: { backgroundColor: Colors.card, justifyContent: "center", alignItems: "center" },
  framePlaceholderText: { color: Colors.subtext },
  hint: { color: Colors.subtext, fontSize: 12, textAlign: "center", lineHeight: 18 },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  resetBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 16,
              alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  resetBtnText: { color: Colors.subtext, fontWeight: "700" },
  doneBtn: { flex: 2, backgroundColor: Colors.accent, borderRadius: 14, padding: 16, alignItems: "center" },
  doneBtnDisabled: { opacity: 0.4 },
  doneBtnText: { color: Colors.bg, fontWeight: "800", fontSize: 15 },
});
