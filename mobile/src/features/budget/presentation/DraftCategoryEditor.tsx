import { MaterialIcons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors, Fonts, Radius } from '../../../constants/theme';
import { DraftBudgetCategory } from '../../../types';

type Props = {
  categories: DraftBudgetCategory[];
  onChange: (categories: DraftBudgetCategory[]) => void;
  addLabel?: string;
};

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

export function DraftCategoryEditor({
  categories,
  onChange,
  addLabel = 'Add another vessel',
}: Props) {
  const updateCategory = (id: string, patch: Partial<DraftBudgetCategory>) => {
    onChange(categories.map((category) => (
      category.id === id ? { ...category, ...patch } : category
    )));
  };

  const removeCategory = (id: string) => {
    onChange(categories.filter((category) => category.id !== id));
  };

  const addCategory = () => {
    onChange([
      ...categories,
      { id: nextId('category'), name: '', amount: '', subcategories: [] },
    ]);
  };

  const addSubcategory = (categoryId: string) => {
    onChange(categories.map((category) => (
      category.id === categoryId
        ? {
          ...category,
          subcategories: [
            ...category.subcategories,
            { id: nextId('subcategory'), name: '', amount: '' },
          ],
        }
        : category
    )));
  };

  const updateSubcategory = (
    categoryId: string,
    subcategoryId: string,
    patch: Partial<DraftBudgetCategory['subcategories'][number]>,
  ) => {
    onChange(categories.map((category) => (
      category.id === categoryId
        ? {
          ...category,
          subcategories: category.subcategories.map((subcategory) => (
            subcategory.id === subcategoryId ? { ...subcategory, ...patch } : subcategory
          )),
        }
        : category
    )));
  };

  const removeSubcategory = (categoryId: string, subcategoryId: string) => {
    onChange(categories.map((category) => (
      category.id === categoryId
        ? {
          ...category,
          subcategories: category.subcategories.filter((subcategory) => subcategory.id !== subcategoryId),
        }
        : category
    )));
  };

  return (
    <View style={styles.editor}>
      {categories.map((category) => {
        const hasChildren = category.subcategories.length > 0;
        return (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.row}>
              <TextInput
                value={category.name}
                onChangeText={(name) => updateCategory(category.id, { name })}
                placeholder="Vessel name"
                placeholderTextColor={`${Colors.textSecondary}70`}
                style={styles.nameInput}
              />
              {!hasChildren ? (
                <TextInput
                  value={category.amount}
                  onChangeText={(amount) => updateCategory(category.id, { amount })}
                  placeholder="Amount"
                  placeholderTextColor={`${Colors.textSecondary}70`}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                />
              ) : (
                <Text style={styles.sumHint}>Total follows smaller vessels</Text>
              )}
              <TouchableOpacity
                onPress={() => removeCategory(category.id)}
                activeOpacity={0.8}
                style={styles.iconButton}
                accessibilityRole="button"
                accessibilityLabel="Remove vessel"
              >
                <MaterialIcons name="close" size={18} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {category.subcategories.map((subcategory) => (
              <View key={subcategory.id} style={styles.subcategoryRow}>
                <TextInput
                  value={subcategory.name}
                  onChangeText={(name) => updateSubcategory(category.id, subcategory.id, { name })}
                  placeholder="Smaller vessel"
                  placeholderTextColor={`${Colors.textSecondary}70`}
                  style={styles.subcategoryNameInput}
                />
                <TextInput
                  value={subcategory.amount}
                  onChangeText={(amount) => updateSubcategory(category.id, subcategory.id, { amount })}
                  placeholder="Amount"
                  placeholderTextColor={`${Colors.textSecondary}70`}
                  keyboardType="decimal-pad"
                  style={styles.subcategoryAmountInput}
                />
                <TouchableOpacity
                  onPress={() => removeSubcategory(category.id, subcategory.id)}
                  activeOpacity={0.8}
                  style={styles.iconButton}
                  accessibilityRole="button"
                  accessibilityLabel="Remove smaller vessel"
                >
                  <MaterialIcons name="close" size={17} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => addSubcategory(category.id)}
              activeOpacity={0.78}
              style={styles.textAction}
            >
              <Text style={styles.textActionLabel}>
                {hasChildren ? 'Add another smaller vessel' : 'Divide into smaller vessels'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity onPress={addCategory} activeOpacity={0.78} style={styles.addButton}>
        <MaterialIcons name="add" size={18} color={Colors.palette.green} />
        <Text style={styles.addButtonText}>{addLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { gap: 12 },
  categoryCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.06)',
    backgroundColor: 'rgba(255,255,255,0.40)',
    padding: 14,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
    paddingHorizontal: 12,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
  },
  amountInput: {
    width: 96,
    minHeight: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
    paddingHorizontal: 10,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  sumHint: {
    width: 110,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
  },
  subcategoryRow: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1.5,
    borderLeftColor: 'rgba(79,175,143,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subcategoryNameInput: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
    paddingHorizontal: 12,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
  },
  subcategoryAmountInput: {
    width: 92,
    minHeight: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1.2,
    borderColor: 'rgba(26,26,26,0.07)',
    paddingHorizontal: 10,
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  textAction: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  textActionLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.palette.green,
  },
  addButton: {
    minHeight: 46,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.2,
    borderColor: 'rgba(79,175,143,0.24)',
    backgroundColor: 'rgba(79,175,143,0.08)',
  },
  addButtonText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.palette.green,
  },
});
