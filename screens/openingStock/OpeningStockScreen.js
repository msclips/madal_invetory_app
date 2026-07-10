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
import { Plus, Search, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import api from '../../services/api';
import { Colors, Card, Input, Button, Select, DatePicker } from '../../components/UI';

export default function OpeningStockScreen() {
  const [itemsList, setItemsList] = useState([]);
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
  const [date, setDate] = useState('');
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [itemsDropdown, setItemsDropdown] = useState([]);
  const [validationErrors, setValidationErrors] = useState({ date: '', itemId: '', qty: '' });

  const fetchOpeningStock = async (p = page, s = search, isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError('');
    try {
      const response = await api.get('/opening-stock/datatable', {
        params: { page: p, limit, search: s }
      });
      if (response.data.status) {
        setItemsList(response.data.data.data || []);
        setTotal(response.data.data.total || 0);
      } else {
        setError('Failed to fetch opening stock');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load opening stock');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchItemsAutocomplete = async () => {
    try {
      const response = await api.get('/item/autocomplete');
      if (response.data.status) {
        setItemsDropdown(response.data.data.map(i => ({ id: i.id, name: i.name })) || []);
      }
    } catch (err) {
      console.log('Error fetching items for dropdown', err);
    }
  };

  useEffect(() => {
    fetchOpeningStock(page, search);
    fetchItemsAutocomplete();
  }, [page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOpeningStock(page, search, true);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
    fetchOpeningStock(1, val);
  };

  const handleOpenCreate = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setItemId('');
    setQty('');
    setFormError('');
    setValidationErrors({ date: '', itemId: '', qty: '' });
    setFormModalVisible(true);
  };

  const handleSave = async () => {
    let hasError = false;
    const errors = { date: '', itemId: '', qty: '' };

    if (!date) {
      errors.date = 'Date is required';
      hasError = true;
    }
    if (!itemId) {
      errors.itemId = 'Item is required';
      hasError = true;
    }
    if (!qty || isNaN(qty) || parseInt(qty) <= 0) {
      errors.qty = 'Quantity is required and must be greater than 0';
      hasError = true;
    }

    setValidationErrors(errors);
    if (hasError) return;

    setFormLoading(true);
    setFormError('');

    try {
      const response = await api.post('/opening-stock/store', { 
        date, 
        item_id: parseInt(itemId), 
        qty: parseInt(qty) 
      });

      if (response.data.status) {
        setFormModalVisible(false);
        fetchOpeningStock(page, search);
      } else {
        setFormError(response.data.message || 'Failed to save');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error occurred while saving');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/opening-stock/delete/${id}`);
      if (response.data.status) {
        const newTotal = total - 1;
        const maxPage = Math.max(1, Math.ceil(newTotal / limit));
        const nextPage = page > maxPage ? maxPage : page;
        setPage(nextPage);
        fetchOpeningStock(nextPage, search);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete entry');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Opening Stock</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenCreate}>
          <Plus size={20} color={Colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={Colors.mutedForeground} style={styles.searchIcon} />
        <TextInput 
          placeholder="Search opening stock..."
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
          <Text style={styles.infoText}>Loading opening stock...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : itemsList.length === 0 ? (
          <Text style={styles.infoText}>No opening stock found.</Text>
        ) : (
          itemsList.map((item, idx) => (
            <Card key={item.id || idx} style={styles.entryCard}>
              <View style={styles.entryCardRow}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryTitle} numberOfLines={2}>{item.item_name || 'N/A'}</Text>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryMetaText}>Date: {item.date}</Text>
                  </View>
                </View>
                <View style={styles.entryRight}>
                  <View style={styles.qtyContainer}>
                    <Text style={styles.qtyLabel}>Qty</Text>
                    <Text style={styles.qtyValue}>{item.qty}</Text>
                  </View>
                  {item.is_delete ? (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                      <Trash2 size={16} color={Colors.destructive} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.disabledActionSpacer} />
                  )}
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

      {/* Create Modal */}
      <Modal
        visible={formModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFormModalVisible(false)}
      >
        <View style={styles.formModalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.formModalHeader}>
              <Text style={styles.formModalTitle}>Add Opening Stock</Text>
              <TouchableOpacity onPress={() => setFormModalVisible(false)}>
                <X size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View style={styles.formErrorAlert}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            <DatePicker 
              label="Date"
              value={date}
              onChange={(val) => {
                setDate(val);
                if (validationErrors.date) setValidationErrors({ ...validationErrors, date: '' });
              }}
              error={validationErrors.date}
            />

            <Select 
              label="Select Item"
              selectedValue={itemId}
              onValueChange={(val) => {
                setItemId(val);
                if (validationErrors.itemId) setValidationErrors({ ...validationErrors, itemId: '' });
              }}
              items={itemsDropdown}
              placeholder="Choose an item"
              error={validationErrors.itemId}
            />

            <Input 
              label="Quantity"
              placeholder="Enter Quantity"
              value={qty}
              onChangeText={(text) => {
                setQty(text);
                if (validationErrors.qty) setValidationErrors({ ...validationErrors, qty: '' });
              }}
              keyboardType="number-pad"
              error={validationErrors.qty}
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
                onPress={handleSave}
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
  entryCard: {
    marginBottom: 12,
    padding: 16,
  },
  entryCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryInfo: {
    flex: 1,
    paddingRight: 16,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryMetaText: {
    fontSize: 13,
    color: Colors.mutedForeground,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  qtyContainer: {
    alignItems: 'flex-end',
  },
  qtyLabel: {
    fontSize: 11,
    color: Colors.mutedForeground,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.secondary,
  },
  disabledActionSpacer: {
    width: 32,
    height: 32,
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
