import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Modal, Alert,
} from 'react-native';
import { Colors } from '../constants/Colors';
import type { Player, Position, Shoot, TeamSide } from '../contexts/RosterContext';

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

export default function PlayerForm({ visible, onClose, onSave, initial }: Props) {
  const [name,     setName]     = useState(initial?.name     ?? '');
  const [jersey,   setJersey]   = useState(initial?.jersey   ?? '');
  const [position, setPosition] = useState<Position>(initial?.position ?? 'C');
  const [shoot,    setShoot]    = useState<Shoot>(initial?.shoot ?? 'L');
  const [age,      setAge]      = useState(String(initial?.age ?? ''));
  const [team,     setTeam]     = useState<TeamSide>(initial?.team ?? 'HOME');

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('오류', '이름을 입력해주세요'); return; }
    if (!jersey.trim()) { Alert.alert('오류', '등번호를 입력해주세요'); return; }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 60) {
      Alert.alert('오류', '나이를 올바르게 입력해주세요 (5~60)'); return;
    }
    onSave({ name: name.trim(), jersey: jersey.trim(), position, shoot, age: ageNum, team });
    onClose();
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

            {/* 등번호 + 나이 */}
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>등번호 *</Text>
                <TextInput style={s.input} value={jersey} onChangeText={setJersey}
                  placeholder="예: 47" placeholderTextColor={Colors.subtext} keyboardType="number-pad" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>나이 *</Text>
                <TextInput style={s.input} value={age} onChangeText={setAge}
                  placeholder="예: 16" placeholderTextColor={Colors.subtext} keyboardType="number-pad" />
              </View>
            </View>

            {/* 팀 */}
            <Text style={s.label}>팀</Text>
            <View style={s.toggleRow}>
              {(['HOME', 'AWAY'] as TeamSide[]).map(t => (
                <Pressable key={t} style={[s.toggleBtn, team === t && s.toggleBtnActive]} onPress={() => setTeam(t)}>
                  <Text style={[s.toggleText, team === t && s.toggleTextActive]}>
                    {t === 'HOME' ? '🏠 홈팀' : '✈️ 어웨이팀'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 포지션 */}
            <Text style={s.label}>포지션</Text>
            <View style={s.chipRow}>
              {POSITIONS.map(pos => (
                <Pressable key={pos} style={[s.chip, position === pos && s.chipActive]} onPress={() => setPosition(pos)}>
                  <Text style={[s.chipText, position === pos && s.chipTextActive]}>{POS_LABEL[pos]}</Text>
                </Pressable>
              ))}
            </View>

            {/* 레프트/라이트 */}
            <Text style={s.label}>슛 방향</Text>
            <View style={s.toggleRow}>
              {(['L', 'R'] as Shoot[]).map(sh => (
                <Pressable key={sh} style={[s.toggleBtn, shoot === sh && s.toggleBtnActive]} onPress={() => setShoot(sh)}>
                  <Text style={[s.toggleText, shoot === sh && s.toggleTextActive]}>
                    {sh === 'L' ? '🏒 레프트' : '🏒 라이트'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* 저장 버튼 */}
            <Pressable style={s.saveBtn} onPress={handleSave}>
              <Text style={s.saveBtnText}>저장</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  closeBtn: { fontSize: 20, color: Colors.subtext, padding: 4 },
  body: { padding: 20, gap: 4, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.subtext, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  input: { height: 48, backgroundColor: Colors.input, borderRadius: 10, paddingHorizontal: 14, color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border },
  row: { flexDirection: 'row', gap: 10 },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, height: 40, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  toggleBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  toggleText: { fontSize: 13, color: Colors.subtext, fontWeight: '600' },
  toggleTextActive: { color: Colors.accent },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg },
  chipActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  chipText: { fontSize: 12, color: Colors.subtext, fontWeight: '600' },
  chipTextActive: { color: Colors.accent },
  saveBtn: { height: 52, borderRadius: 12, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.bg },
});
