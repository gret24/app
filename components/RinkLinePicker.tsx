/**
 * RinkLinePicker
 * 영상 첫 프레임 위에서 4개 점을 탭해 링크 라인(호모그래피) 기준점 지정.
 *
 * 사용 흐름:
 *   1) 서버가 /frame/{video_stem}/first 로 첫 프레임 이미지 반환
 *   2) 사용자가 화면에서 4개 코너 점을 순서대로 탭
 *   3) "저장" 버튼 → POST /api/homography/custom 호출
 *   4) onSave 콜백으로 상위 컴포넌트에 알림
 */

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  Image, Alert, ScrollView, Dimensions,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { API_BASE_URL } from '../api/config';
import { apiPost } from '../api/client';

const { width: SW } = Dimensions.get('window');
const IMG_W = SW - 32;
const IMG_H = Math.round(IMG_W * 9 / 16);   // 16:9 기본 비율

// 4개 기준점 레이블 — 순서대로 탭
const POINT_LABELS = [
  '① 좌측 블루라인 (상)',
  '② 우측 블루라인 (상)',
  '③ 좌측 블루라인 (하)',
  '④ 우측 블루라인 (하)',
];

// 대응하는 링크 좌표 (픽셀 단위: 600×300 — lib/homography.ts 기준)
const RINK_POINTS_DEFAULT: [number, number][] = [
  [0,   0],
  [600, 0],
  [0,   300],
  [600, 300],
];

interface TapPoint {
  relX: number;   // 0-1 (이미지 폭 기준)
  relY: number;   // 0-1 (이미지 높이 기준)
  dispX: number;  // 화면 px (마커 렌더링용)
  dispY: number;
}

interface Props {
  videoStem: string;
  frameUri?: string;       // 직접 URI 전달 시 사용, 없으면 서버 URL 자동 구성
  onSave: (matrix: number[]) => void;
  onSkip: () => void;
}

export default function RinkLinePicker({ videoStem, frameUri, onSave, onSkip }: Props) {
  const [points, setPoints] = useState<TapPoint[]>([]);
  const [saving, setSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const imgRef = useRef<View>(null);

  const imageUrl = frameUri ?? `${API_BASE_URL}/frame/${videoStem}/first`;

  // ── 탭 처리 ───────────────────────────────────────────────────────
  const handleImageTap = (evt: any) => {
    if (points.length >= 4) return;
    const { locationX, locationY } = evt.nativeEvent;
    const relX = Math.max(0, Math.min(1, locationX / IMG_W));
    const relY = Math.max(0, Math.min(1, locationY / IMG_H));
    setPoints(prev => [...prev, { relX, relY, dispX: locationX, dispY: locationY }]);
  };

  const handleUndo = () => setPoints(prev => prev.slice(0, -1));

  const handleReset = () => setPoints([]);

  // ── 저장 → 서버 호모그래피 계산 ──────────────────────────────────
  const handleSave = async () => {
    if (points.length < 4) {
      Alert.alert('4개 점 필요', `현재 ${points.length}개 지정됨. 4개를 모두 탭해주세요.`);
      return;
    }
    setSaving(true);
    try {
      // 정규화 좌표 → 실제 픽셀 좌표로 역산 (서버 기본 해상도 1920×1080 가정)
      // 서버에서 frame_w, frame_h를 알면 더 정확하지만 없으면 normalized 전달
      const imagePoints: [number, number][] = points.map(p => [
        Math.round(p.relX * 1920),
        Math.round(p.relY * 1080),
      ]);

      const res = await apiPost<{ matrix: number[] }>('/api/homography/custom', {
        video_stem: videoStem,
        image_points: imagePoints,
        rink_points: RINK_POINTS_DEFAULT,
      });

      onSave(res.matrix);
    } catch (e: any) {
      Alert.alert('저장 실패', e.message ?? '호모그래피 계산 오류');
    } finally {
      setSaving(false);
    }
  };

  const nextLabel = points.length < 4 ? POINT_LABELS[points.length] : null;

  return (
    <View style={s.root}>
      {/* 안내 */}
      <View style={s.infoBox}>
        <Text style={s.infoTitle}>🏒 링크 라인 지정</Text>
        {nextLabel ? (
          <Text style={s.infoSub}>
            <Text style={{ color: Colors.accent }}>다음 탭: </Text>{nextLabel}
          </Text>
        ) : (
          <Text style={[s.infoSub, { color: '#34C759' }]}>✅ 4개 완료 — 저장 버튼을 누르세요</Text>
        )}
      </View>

      {/* 이미지 + 탭 영역 */}
      <View
        ref={imgRef}
        style={s.imageContainer}
        onStartShouldSetResponder={() => true}
        onResponderGrant={handleImageTap}
      >
        <Image
          source={{ uri: imageUrl }}
          style={s.image}
          resizeMode="cover"
          onLoad={() => setImgLoaded(true)}
        />
        {!imgLoaded && (
          <View style={s.imgLoading}>
            <ActivityIndicator color={Colors.accent} />
            <Text style={{ color: Colors.subtext, marginTop: 8 }}>프레임 로딩 중...</Text>
          </View>
        )}

        {/* 탭 마커 */}
        {points.map((pt, idx) => (
          <View
            key={idx}
            pointerEvents="none"
            style={[s.marker, { left: pt.dispX - 16, top: pt.dispY - 16 }]}
          >
            <Text style={s.markerText}>{idx + 1}</Text>
          </View>
        ))}

        {/* 점선 연결선 (4점 완성 시) */}
        {points.length === 4 && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* 간단 표시: 각 점에 초록 아웃라인 */}
          </View>
        )}
      </View>

      {/* 점 목록 */}
      <View style={s.pointList}>
        {POINT_LABELS.map((label, idx) => (
          <View key={idx} style={s.pointRow}>
            <View style={[s.pointBadge, points[idx] ? s.pointBadgeDone : {}]}>
              <Text style={[s.pointBadgeText, points[idx] ? { color: Colors.accent } : {}]}>
                {idx + 1}
              </Text>
            </View>
            <Text style={[s.pointLabel, points[idx] && { color: Colors.text }]}>{label}</Text>
            {points[idx] && (
              <Text style={s.pointCoord}>
                ({Math.round(points[idx].relX * 100)}%, {Math.round(points[idx].relY * 100)}%)
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* 버튼들 */}
      <View style={s.btnRow}>
        <Pressable style={s.undoBtn} onPress={handleUndo} disabled={points.length === 0}>
          <Text style={[s.undoBtnText, points.length === 0 && { opacity: 0.4 }]}>↩ 되돌리기</Text>
        </Pressable>
        <Pressable style={s.resetBtn} onPress={handleReset} disabled={points.length === 0}>
          <Text style={[s.resetBtnText, points.length === 0 && { opacity: 0.4 }]}>🔄 초기화</Text>
        </Pressable>
      </View>

      <Pressable
        style={[s.saveBtn, (points.length < 4 || saving) && s.saveBtnDisabled]}
        onPress={handleSave}
        disabled={points.length < 4 || saving}
      >
        {saving
          ? <ActivityIndicator color={Colors.bg} />
          : <Text style={s.saveBtnText}>저장 & 분석 시작</Text>
        }
      </Pressable>

      <Pressable style={s.skipBtn} onPress={onSkip}>
        <Text style={s.skipBtnText}>건너뛰기 (자동 감지 사용)</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { gap: 14 },

  infoBox: {
    backgroundColor: Colors.card, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: Colors.border, gap: 4,
  },
  infoTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  infoSub: { fontSize: 13, color: Colors.subtext },

  imageContainer: {
    width: IMG_W, height: IMG_H,
    borderRadius: 12, overflow: 'hidden',
    backgroundColor: Colors.card,
    alignSelf: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  image: { width: '100%', height: '100%' },
  imgLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card,
  },

  marker: {
    position: 'absolute', width: 32, height: 32,
    borderRadius: 16, backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  markerText: { fontSize: 14, fontWeight: '900', color: Colors.bg },

  pointList: { gap: 6 },
  pointRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pointBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.card, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pointBadgeDone: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  pointBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.subtext },
  pointLabel: { flex: 1, fontSize: 13, color: Colors.subtext },
  pointCoord: { fontSize: 11, color: Colors.outline },

  btnRow: { flexDirection: 'row', gap: 10 },
  undoBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  undoBtnText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  resetBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  resetBtnText: { fontSize: 13, color: Colors.text, fontWeight: '600' },

  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: Colors.bg, fontWeight: '800', fontSize: 16 },

  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { fontSize: 13, color: Colors.subtext },
});
