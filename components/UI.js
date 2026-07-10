import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Modal, 
  FlatList, 
  Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ChevronDown, Calendar as CalendarIcon, X } from 'lucide-react-native';

// Colors (shadcn-inspired Dark Theme)
export const Colors = {
  background: '#09090b',
  card: '#18181b',
  popover: '#09090b',
  primary: '#fafafa',
  primaryForeground: '#18181b',
  secondary: '#27272a',
  secondaryForeground: '#fafafa',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  accent: '#27272a',
  accentForeground: '#fafafa',
  destructive: '#ef4444',
  destructiveForeground: '#fafafa',
  border: '#27272a',
  input: '#27272a',
  ring: '#d4d4d8',
  text: '#fafafa',
};

// Clean UI Card
export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const CardHeader = ({ children, style }) => (
  <View style={[styles.cardHeader, style]}>{children}</View>
);

export const CardTitle = ({ children, style }) => (
  <Text style={[styles.cardTitle, style]}>{children}</Text>
);

export const CardDescription = ({ children, style }) => (
  <Text style={[styles.cardDescription, style]}>{children}</Text>
);

export const CardContent = ({ children, style }) => (
  <View style={[styles.cardContent, style]}>{children}</View>
);

// Standard shadcn-style Button
export const Button = ({ 
  children, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false, 
  style, 
  textStyle 
}) => {
  let buttonStyle = styles.btnPrimary;
  let textStyleChoice = styles.btnTextPrimary;

  if (variant === 'secondary') {
    buttonStyle = styles.btnSecondary;
    textStyleChoice = styles.btnTextSecondary;
  } else if (variant === 'outline') {
    buttonStyle = styles.btnOutline;
    textStyleChoice = styles.btnTextOutline;
  } else if (variant === 'destructive') {
    buttonStyle = styles.btnDestructive;
    textStyleChoice = styles.btnTextDestructive;
  }

  const isBtnDisabled = disabled || loading;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={isBtnDisabled}
      style={[
        styles.btnBase, 
        buttonStyle, 
        isBtnDisabled && { opacity: 0.5 },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.primaryForeground : Colors.text} size="small" />
      ) : (
        <Text style={[styles.btnTextBase, textStyleChoice, textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

// Standard input component with label & validations
export const Input = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  secureTextEntry, 
  keyboardType, 
  error, 
  style,
  autoCapitalize = 'none',
  ...props 
}) => (
  <View style={[styles.inputGroup, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      style={[styles.inputField, error && styles.inputFieldError]}
      placeholder={placeholder}
      placeholderTextColor={Colors.mutedForeground}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      {...props}
    />
    {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}
  </View>
);

// Select component that opens a styled bottom sheet modal
export const Select = ({ 
  label, 
  selectedValue, 
  onValueChange, 
  items = [], 
  placeholder = 'Select an item', 
  error 
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find(item => String(item.id) === String(selectedValue));

  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity 
        style={[styles.selectTrigger, error && styles.inputFieldError]} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[styles.selectTriggerText, !selectedItem && { color: Colors.mutedForeground }]}>
          {selectedItem ? selectedItem.name : placeholder}
        </Text>
        <ChevronDown size={18} color={Colors.mutedForeground} />
      </TouchableOpacity>
      {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.modalItem, 
                    String(item.id) === String(selectedValue) && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    onValueChange(item.id);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText, 
                    String(item.id) === String(selectedValue) && styles.modalItemSelectedText
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.modalList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Date picker component
export const DatePicker = ({ label, value, onChange, error }) => {
  const [show, setShow] = useState(false);

  // Format date to YYYY-MM-DD
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  };

  const handleDateChange = (event, selectedDate) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(formatDate(selectedDate));
    }
  };

  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity 
        style={[styles.selectTrigger, error && styles.inputFieldError]} 
        onPress={() => setShow(true)}
      >
        <Text style={[styles.selectTriggerText, !value && { color: Colors.mutedForeground }]}>
          {value || 'YYYY-MM-DD'}
        </Text>
        <CalendarIcon size={18} color={Colors.mutedForeground} />
      </TouchableOpacity>
      {error ? <Text style={styles.inputErrorText}>{error}</Text> : null}

      {show && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.mutedForeground,
    marginTop: 4,
  },
  cardContent: {
    marginTop: 4,
  },
  btnBase: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnTextBase: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
  },
  btnTextPrimary: {
    color: Colors.primaryForeground,
  },
  btnSecondary: {
    backgroundColor: Colors.secondary,
  },
  btnTextSecondary: {
    color: Colors.secondaryForeground,
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnTextOutline: {
    color: Colors.text,
  },
  btnDestructive: {
    backgroundColor: Colors.destructive,
  },
  btnTextDestructive: {
    color: Colors.destructiveForeground,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: 'transparent',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputFieldError: {
    borderColor: Colors.destructive,
  },
  inputErrorText: {
    color: Colors.destructive,
    fontSize: 12,
    marginTop: 4,
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectTriggerText: {
    fontSize: 14,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '60%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalList: {
    marginTop: 8,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modalItemSelected: {
    backgroundColor: Colors.secondary,
  },
  modalItemText: {
    color: Colors.mutedForeground,
    fontSize: 14,
  },
  modalItemSelectedText: {
    color: Colors.text,
    fontWeight: 'bold',
  },
});
