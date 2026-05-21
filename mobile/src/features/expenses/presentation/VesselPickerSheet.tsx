import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Radius, Space } from '../../../constants/theme';
import type { ExpenseTarget } from '../../budget/application/useHomeBudget';

type Props = {
  visible: boolean;
  targets: ExpenseTarget[];
  selectedTargetId: string | null;
  onSelect: (targetId: string) => void;
  onClose: () => void;
};

function sectionLabel(section: ExpenseTarget['section']) {
  return section === 'steady_obligations' ? 'Steady obligation' : 'Household vessel';
}

function optionLabel(target: ExpenseTarget) {
  return target.parentLabel ? `${target.parentLabel} / ${target.displayLabel}` : target.displayLabel;
}

export function VesselPickerSheet({
  visible,
  targets,
  selectedTargetId,
  onSelect,
  onClose,
}: Props) {
  const fallbackId = targets[0]?.id ?? '';
  const [pickerValue, setPickerValue] = useState(selectedTargetId ?? fallbackId);
  const selectedTarget = targets.find((target) => target.id === pickerValue) ?? targets[0];

  useEffect(() => {
    if (visible) setPickerValue(selectedTargetId ?? fallbackId);
  }, [fallbackId, selectedTargetId, visible]);

  if (!visible) return null;

  if (!targets.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No vessels yet</Text>
        <Text style={styles.emptyText}>Shape the monthly plan before recording expenses.</Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelCopy}>
          <Text style={styles.panelTitle}>Choose a vessel</Text>
          <Text style={styles.panelSubtitle} numberOfLines={1}>
            {selectedTarget ? sectionLabel(selectedTarget.section) : 'Every category and smaller vessel'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (pickerValue) onSelect(pickerValue);
            else onClose();
          }}
          activeOpacity={0.78}
          style={styles.doneButton}
        >
          <Text style={styles.doneText}>Use</Text>
          <MaterialIcons name="keyboard-arrow-up" size={16} color={Colors.palette.green} />
        </TouchableOpacity>
      </View>

      <View style={styles.pickerShell}>
        <Picker
          selectedValue={pickerValue}
          onValueChange={(value) => {
            const next = String(value);
            setPickerValue(next);
          }}
          itemStyle={styles.pickerItem}
          dropdownIconColor={Colors.palette.green}
          style={styles.picker}
        >
          {targets.map((target) => (
            <Picker.Item
              key={target.id}
              label={optionLabel(target)}
              value={target.id}
              color={Colors.text.primary}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: Space.sm,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.46)',
    borderWidth: 1.5,
    borderColor: 'rgba(79,175,143,0.18)',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  panelCopy: {
    flex: 1,
    minWidth: 0,
  },
  panelTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text.primary,
  },
  panelSubtitle: {
    marginTop: 1,
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    color: Colors.text.secondary,
  },
  doneButton: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(79,175,143,0.10)',
    paddingHorizontal: 12,
  },
  doneText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.palette.green,
  },
  pickerShell: {
    overflow: 'hidden',
    borderRadius: Radius.md,
  },
  picker: {
    height: 190,
    color: Colors.text.primary,
  },
  pickerItem: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 17,
    color: Colors.text.primary,
  },
  emptyState: {
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderWidth: 1.5,
    borderColor: 'rgba(26,26,26,0.06)',
    padding: 18,
    gap: 4,
  },
  emptyTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text.primary,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text.secondary,
  },
});
