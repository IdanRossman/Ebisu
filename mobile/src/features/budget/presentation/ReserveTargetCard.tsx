import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Radius } from '../../../constants/theme';
import type { CurrencyCode } from '../../../types';
import { formatMoney, parseMoneyInput } from '../domain/money';

type Props = {
  currency: CurrencyCode;
  reserveTargetAmount: number | null;
  onChangeReserveTarget: (amount: number | null) => void;
};

export function ReserveTargetCard({ currency, reserveTargetAmount, onChangeReserveTarget }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(reserveTargetAmount === null ? '' : String(reserveTargetAmount));

  useEffect(() => setInput(reserveTargetAmount === null ? '' : String(reserveTargetAmount)), [reserveTargetAmount]);

  const save = () => {
    const amount = parseMoneyInput(input);
    if (!Number.isFinite(amount) || amount < 0) return;
    onChangeReserveTarget(amount);
    setEditing(false);
  };

  return (
    <>
      <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.84} style={styles.card}>
        <View style={styles.copy}>
          <Text style={styles.label}>Reserve target</Text>
          <Text style={styles.amount}>{reserveTargetAmount === null ? 'Not set' : formatMoney(reserveTargetAmount, currency)}</Text>
          <Text style={styles.support}>Ebisu will help you notice when spending begins to touch this amount.</Text>
        </View>
        <View style={styles.editPill}>
          <MaterialIcons name="edit" size={16} color={Colors.palette.green} />
          <Text style={styles.editText}>{reserveTargetAmount === null ? 'Set' : 'Edit'}</Text>
        </View>
      </TouchableOpacity>
      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reserve target</Text>
            <Text style={styles.modalCopy}>How much would you like to keep untouched this period?</Text>
            <TextInput value={input} onChangeText={setInput} keyboardType="decimal-pad" style={styles.input} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { onChangeReserveTarget(null); setEditing(false); }} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={save} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 92, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(79,175,143,0.22)', backgroundColor: 'rgba(79,175,143,0.08)', paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  copy: { flex: 1 },
  label: { fontFamily: Fonts.bodyMedium, fontSize: 13, lineHeight: 18, color: Colors.text.secondary },
  amount: { marginTop: 2, fontFamily: Fonts.headingSemiBold, fontSize: 22, lineHeight: 28, color: Colors.palette.green },
  support: { marginTop: 3, fontFamily: Fonts.body, fontSize: 12, lineHeight: 17, color: Colors.text.secondary },
  editPill: { minHeight: 38, borderRadius: Radius.full, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.58)', borderWidth: 1.2, borderColor: 'rgba(26,26,26,0.07)' },
  editText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.palette.green },
  backdrop: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: Colors.overlay.scrim },
  modalCard: { borderRadius: Radius.lg, padding: 18, backgroundColor: Colors.surface.warm, gap: 10 },
  modalTitle: { fontFamily: Fonts.headingSemiBold, fontSize: 17, lineHeight: 24, color: Colors.text.primary, textAlign: 'center' },
  modalCopy: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, color: Colors.text.secondary, textAlign: 'center' },
  input: { minHeight: 54, borderRadius: Radius.md, borderWidth: 1.5, borderColor: 'rgba(26,26,26,0.08)', backgroundColor: 'rgba(255,255,255,0.76)', paddingHorizontal: 16, fontFamily: Fonts.headingSemiBold, fontSize: 20, color: Colors.text.primary, textAlign: 'center' },
  modalActions: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 2 },
  secondaryButton: { minHeight: 42, minWidth: 76, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.58)', borderWidth: 1.2, borderColor: 'rgba(26,26,26,0.07)' },
  secondaryButtonText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.secondary },
  primaryButton: { minHeight: 42, minWidth: 76, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.palette.green },
  primaryButtonText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text.inverse },
});
