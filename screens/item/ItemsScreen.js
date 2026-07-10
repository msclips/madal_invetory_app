import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Modal, 
  TouchableOpacity, 
  RefreshControl,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Trash2, Edit2, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import api from '../../services/api';
import { Colors, Card, Input, Button, Select } from '../../components/UI';

export default function ItemsScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [limit] = useState(10);

  // Form State
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null); // null for create, ID for edit
  const [name, setName] = useState('');
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState([]);
  const [validationErrors, setValidationErrors] = useState({ name: '', unitId: '' });

  const fetchItems = async (p = page, s = search, isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError('');
    try {
      const response = await api.get('/item/datatable', {
        params: { page: p, limit, search: s }
      });
      if (response.data.status) {
        setItems(response.data.data.data || []);
        setTotal(response.data.data.total || 0);
      } else {
        setError('Failed to fetch items');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await api.get('/unit/autocomplete');
      if (response.data.status) {
        setUnits(response.data.data.map(u => ({ id: u.id, name: u.name })) || []);
      }
    } catch (err) {
      console.log('Error fetching units dropdown', err);
    }
  };

  useEffect(() => {
    fetchItems(page, search);
    fetchUnits();
  }, [page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems(page, search, true);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1); // Reset to first page
    fetchItems(1, val);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setUnitId('');
    setFormError('');
    setValidationErrors({ name: '', unitId: '' });
    setFormModalVisible(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    setName(item.name);
    setUnitId(item.unit_id);
    setFormError('');
    setValidationErrors({ name: '', unitId: '' });
    setFormModalVisible(true);
  };

  const handleSaveItem = async () => {
    let hasError = false;
    const errors = { name: '', unitId: '' };

    if (!name.trim()) {
      errors.name = 'Item name is required';
      hasError = true;
    }
    if (!unitId) {
      errors.unitId = 'Unit is required';
      hasError = true;
    }

    setValidationErrors(errors);
    if (hasError) return;

    setFormLoading(true);
    setFormError('');

    try {
      let response;
      if (editingId) {
        response = await api.put('/item/update', { id: editingId, name, unit_id: unitId });
      } else {
        response = await api.post('/item/store', { name, unit_id: unitId });
      }

      if (response.data.status) {
        setFormModalVisible(false);
        fetchItems(page, search);
      } else {
        setFormError(response.data.message || 'Failed to save item');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error occurred while saving');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const response = await api.delete(`/item/delete/${id}`);
      if (response.data.status) {
        // If current page is now empty and we are not on page 1, go back
        const newTotal = total - 1;
        const maxPage = Math.max(1, Math.ceil(newTotal / limit));
        const nextPage = page > maxPage ? maxPage : page;
        setPage(nextPage);
        fetchItems(nextPage, search);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete item');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Items</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
          <Plus size={20} color={Colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={Colors.mutedForeground} style={styles.searchIcon} />
        <TextInput 
          placeholder="Search items..."
          placeholderTextColor={Colors.mutedForeground}
          value={search}
          onChangeText={handleSearchChange}
          style={styles.searchInput}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.text} />
        }
      >
        {loading && !refreshing ? (
          <Text style={styles.infoText}>Loading items...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={styles.infoText}>No items found.</Text>
        ) : (
          items.map((item, idx) => (
            <Card key={item.id || idx} style={styles.itemCard}>
              <View style={styles.itemCardContent}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemUnit}>Unit: {item.unit_name || 'N/A'}</Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEdit(item)}>
                    <Edit2 size={16} color={Colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteItem(item.id)}>
                    <Trash2 size={16} color={Colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Pagination Controls */}
        {total > limit ? (
          <View style={styles.paginationRow}>
            <TouchableOpacity 
              style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
              disabled={page === 1}
              onPress={() => setPage(page - 1)}
            >
              <ChevronLeft size={18} color={page === 1 ? Colors.mutedForeground : Colors.text} />
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              Page {page} of {Math.ceil(total / limit)}
            </Text>
            <TouchableOpacity 
              style={[styles.pageBtn, page >= Math.ceil(total / limit) && styles.pageBtnDisabled]}
              disabled={page >= Math.ceil(total / limit)}
              onPress={() => setPage(page + 1)}
            >
              <ChevronRight size={18} color={page >= Math.ceil(total / limit) ? Colors.mutedForeground : Colors.text} />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Create / Edit Form Modal */}
      <Modal
        visible={formModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFormModalVisible(false)}
      >
        <View style={styles.formModalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.formModalHeader}>
              <Text style={styles.formModalTitle}>{editingId ? 'Edit Item' : 'Add New Item'}</Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View style={styles.formErrorAlert}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <Input 
              label="Item Name"
              placeholder="Enter Item Name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (validationErrors.name) setValidationErrors({ ...validationErrors, name: '' });
              }}
              error={validationErrors.name}
            />

            <Select 
              label="Select Unit"
              selectedValue={unitId}
              onValueChange={(val) => {
                setUnitId(val);
                if (validationErrors.unitId) setValidationErrors({ ...validationErrors, unitId: '' });
              }}
              items={units}
              placeholder="Choose a unit"
              error={validationErrors.unitId}
            />

            <View style={styles.formActions}>
              <Button 
                variant="outline" 
                style={styles.formBtn} 
                onPress={() => setFormModalVisible(false)}
              >
                Cancel
              </Button>
              <Button 
                style={styles.formBtn} 
                loading={formLoading}
                onPress={handleSaveItem}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 32,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    color: Colors.text,
    paddingLeft: 40,
    paddingRight: 12,
    fontSize: 14,
  },
  scrollContainer: {
    padding: 20,
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
  },
  itemCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemUnit: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  pageBtn: {
    padding: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 6,
  },
  pageBtnDisabled: {
    opacity: 0.5,
  },
  pageIndicator: {
    color: Colors.mutedForeground,
    fontSize: 14,
    marginHorizontal: 16,
  },
  infoText: {
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginVertical: 20,
  },
  errorText: {
    color: Colors.destructive,
    textAlign: 'center',
    marginVertical: 20,
  },
  formModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
  },
  formModalContent: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  formModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  formErrorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Colors.destructive,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  formErrorText: {
    color: Colors.destructive,
    fontSize: 14,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  formBtn: {
    width: '47%',
  },
});
