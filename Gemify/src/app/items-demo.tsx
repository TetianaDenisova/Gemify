import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useItems } from "@/hooks/useItems";
import {
  AppButton,
  AppInput,
  AppText,
  Card,
  CloseIcon,
  IconButton,
  ListItem,
  PencilIcon,
  ScreenHeader,
  ScreenScaffold,
  SectionHeader,
} from "@/shared/components";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/theme";

/**
 * Demo screen for the SQLite items store: create, list, edit, and delete
 * rows via the useItems hook (no raw SQL in the screen).
 */
export default function ItemsDemoScreen() {
  const insets = useSafeAreaInsets();
  const { items, loading, error, addItem, editItem, removeItem } = useItems();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const editing = editingId !== null;
  const canSave = name.trim().length > 0 && !saving;

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingId(null);
  };

  const startEditing = (id: number) => {
    const item = items.find((existing) => existing.id === id);
    if (!item) return;
    setEditingId(id);
    setName(item.name);
    setDescription(item.description ?? "");
  };

  const save = async () => {
    setSaving(true);
    const saved = editing
      ? await editItem(editingId, { name, description })
      : await addItem({ name, description });
    setSaving(false);
    if (saved) resetForm();
  };

  return (
    <>
      <ScreenHeader asStackHeader title="Items" subtitle="SQLite demo" />

      <ScreenScaffold
        contentStyle={{ paddingTop: insets.top + 70 }}
        keyboardAvoiding
      >
        <Card variant="glass">
          <SectionHeader title={editing ? "Edit item" : "New item"} />
          <AppInput
            accessibilityLabel="Item name"
            containerStyle={styles.field}
            label="Name"
            onChangeText={setName}
            placeholder="What is it?"
            value={name}
          />
          <AppInput
            accessibilityLabel="Item description"
            containerStyle={styles.field}
            label="Description (optional)"
            multiline
            onChangeText={setDescription}
            placeholder="A few details..."
            value={description}
          />
          <AppButton
            disabled={!canSave}
            label={editing ? "Save changes" : "Add item"}
            onPress={save}
            style={styles.submit}
          />
          {editing ? (
            <AppButton label="Cancel" onPress={resetForm} variant="ghost" />
          ) : null}
        </Card>

        {error ? (
          <AppText color={colors.danger} style={styles.error} variant="bodySmall">
            {error}
          </AppText>
        ) : null}

        <SectionHeader style={styles.listHeader} title="Saved items" />

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : items.length === 0 ? (
          <AppText style={styles.empty} variant="bodySmall">
            Nothing saved yet — add your first item above.
          </AppText>
        ) : (
          <Card variant="glass">
            {items.map((item, index) => (
              <ListItem
                key={item.id}
                last={index === items.length - 1}
                subtitle={item.description ?? undefined}
                title={item.name}
                trailing={
                  <View style={styles.rowActions}>
                    <IconButton
                      accessibilityLabel={`Edit ${item.name}`}
                      icon={<PencilIcon size={16} />}
                      onPress={() => startEditing(item.id)}
                      size="sm"
                    />
                    <IconButton
                      accessibilityLabel={`Delete ${item.name}`}
                      icon={<CloseIcon color={colors.danger} size={16} />}
                      onPress={() => removeItem(item.id)}
                      size="sm"
                    />
                  </View>
                }
              />
            ))}
          </Card>
        )}
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  empty: {
    marginTop: spacing.sm,
  },
  error: {
    marginTop: spacing.md,
  },
  field: {
    marginTop: spacing.md,
  },
  listHeader: {
    marginTop: spacing.xl,
  },
  loader: {
    marginTop: spacing.lg,
  },
  rowActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.lg,
  },
});
