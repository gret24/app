import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/Colors';
import type { Player, Position, Shoot } from '../contexts/RosterContext';
import { apiPost } from '../api/client';
import { reapplyRoster } from '../api/rosterService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (p: Omit<Player, 'id'>) => void;
  initial?: Partial<Player>;
}

const POSITIONS: Position[] = ['LW', 'RW', 'C', 'D', 'G'];
const POS_LABEL: Record<Position, string> = {
  LW: '🏒L 레프트윙', RW: '🏒R 라이트윙', C: '🎯 센터', D: '🛡️ 수비', G: '🥅 골리',
};

// 서버 position 매핑 (클라이언트 'D' → 서버 'LD')
const toServerPosition = (pos: Position): string =>
  pos === 'D' ? 'LD' : pos;

const ROSTER_FILE = 'my_team.json';

// 생년월일로 나이 계산
const calcAge = (birthdate: string): number => {
  const birthYear = parseInt(birthdate.split('-')[0]);
  return isNaN(birthYear) ? 0 : new Date().getFullYear() - birthYear;
};

export default function PlayerForm({ visible, onClose, onSave, initial }: Props) {
  const [name,      setName]      = useState(initial?.name      ?? '');
  const [jersey,    setJersey]    = useState(initial?.jersey    ?? '');
  const [position,  setPosition]  = useState<Position>(initial?.position ?? 'C');
  const [shoot,     setShoot]     = useState<Shoot>(initial?.shoot ?? 'L');
  const [birthdate, setBirthdate] = useState<string>(() => {
    // initial?.age가 있으면 YYYY-01-01 형식으로 변환, 없으면 빈 문자열
    if (initial?.age) return `${new Date().getFullYear() - initial.age}-01-01`;
    return '';
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim())   { Alert.alert('오류', '이름을 입력해주세요');   return; }
    if (!jersey.trim()) { Alert.alert('오류', '등번호를 입력해주세요'); return; }
    if (!birthdate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
      Alert.alert('오류', '생년월일을 YYYY-MM-DD 형식으로 입력해주세요\n예: 2005-03-15');
      return;
    }

    const age = calcAge(birthdate);
    const playerData = {
      number: jersey.trim(),
      name:   name.trim(),
      position: toServerPosition(position),
      shot_hand: shoot,
      birthdate: birthdate.trim(),
    };

    setSaving(true);
    try {
      // 1. 서버 로스터에 선수 추가 (없으면 로스터 자동 생성)
      try {
        await apiPost(`/api/rosters/${ROSTER_FILE}/players`, playerData);
      } catch (e: any) {
        const msg = e.message ?? '';
        if (msg.includes('Roster not found') || msg.includes('404')) {
          // 로스터 파일 없음 → 신규 생성 후 선수 포함
          await apiPost('/api/rosters', {
            team: 'my_team',
            players: [playerData],
          });
        } else if (msg.includes('already exists') || msg.includes('409')) {
          // 이미 등록된 번호 — 로컬 저장은 진행
        } else {
          throw e;
        }
      }

      // 2. 기존 분석 결과에 재적용 (실패해도 저장은 계속)
      await reapplyRoster(ROSTER_FILE).catch(() => {});

      // 3. 로컬 AsyncStorage 저장 (team은 항상 HOME)
      onSave({ name: name.trim(), jersey: jersey.trim(), position, shoot, age, team: 'HOME' });

      Alert.alert('저장 완료', '선수가 등록되고 로스터에 반영되었습니다');
      onClose();
    } catch (e: any) {
      Alert.alert('저장 실패', e.message ?? '서버 오류');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>선수 등록</Text>
            <Pressable onPress={onClose}><Text style={s.closeBtn}>✕</Text></Pressable>
          </View>

          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            {/* 이름 */}
            <Text style={s.label}>이름 *</Text>
            <TextInput style={s.input} value={name} onChangeText={setName}
              placeholder="선수 이름" placeholderTextColor={Colors.subtext} />

            {/* 등번호 + 생년월일 */}
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>등번호 *</Text>
                <TextInput style={s.input} value={jersey} onChangeText={setJersey}
                  placeholder="예: 47" placeholderTextColor={Colors.subtext} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 2 }}>
                <Text style={s.label}>생년월일 *</Text>
                <TextInput style={s.input} value={birthdate} onChangeText={setBirthdate}
                  placeholder="2005-03-15" placeholderTextColor={Colors.subtext}
                  keyboardType="numbers-and-punctuation" maxLength={10} />
              </View>
            </View>

            {/* 포지션 */}
            <Text style={s.label}>포지션</Text>
            <View style={s.chipRow}>
              {POSITIONS.map(pos => (
                <Pressable key={pos} style={[s.chip, position === pos && s.chipActive]}
                  onPress={() => setPosition(pos)}>
                  <Text style={[s.chipText, position === pos && s.chipTextActive]}>
                    {POS_LABEL[pos]}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 슛 방향 */}
            <Text style={s.label}>슛 방향</Text>
            <View style={s.toggleRow}>
              {(['L', 'R'] as Shoot[]).map(sh => (
                <Pressable key={sh} style={[s.toggleBtn, shoot === sh && s.toggleBtnActive]}
                  onPress={() => setShoot(sh)}>
                  <Text style={[s.toggleText, shoot === sh && s.toggleTextActive]}>
                    {sh === 'L' ? '🏒 레프트' : '🏒 라이트'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 저장 버튼 */}
            <Pressable style={[s.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color={Colors.bg} />
                : <Text style={s.saveBtnText}>저장</Text>
              }
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  closeBtn: { fontSize: 20, color: Colors.subtext, padding: 4 },
  body: { padding: 20, gap: 4, paddingBottom: 40 },
  label: {
    fontSize: 12, fontWeight: '700', color: Colors.subtext,
    letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 12, marginBottom: 6,
  },
  input: {
    height: 48, backgroundColor: Colors.input, borderRadius: 10,
    paddingHorizontal: 14, color: Colors.text, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border,
  },
  row: { flexDirection: 'row', gap: 10 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, height: 40, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
  },
  toggleBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  toggleText: { fontSize: 13, color: Colors.subtext, fontWeight: '600' },
  toggleTextActive: { color: Colors.accent },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg,
  },
  chipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  chipText: { fontSize: 12, color: Colors.subtext, fontWeight: '600' },
  chipTextActive: { color: Colors.accent },
  saveBtn: {
    height: 52, borderRadius: 12, backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center', marginTop: 20,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },
});
