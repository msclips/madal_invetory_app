import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, Package, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react-native';
import api from '../../services/api';
import { AuthContext } from '../../services/authContext';
import { Colors, Card, CardHeader, CardTitle, CardContent, Button } from '../../components/UI';

export default function DashboardScreen({ navigation }) {
  const { signOut, user } = useContext(AuthContext);
  const [stockReport, setStockReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setError('');
    try {
      const response = await api.get('/dashboard');
      if (response.data.status) {
        setStockReport(response.data.data.stockReport || []);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not connect to the server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.log('Error during API logout call', e);
    }
    signOut();
  };

  const menuItems = [
    { name: 'Items', icon: Package, route: 'Items', color: '#3b82f6' },
    { name: 'Opening Stock', icon: Calendar, route: 'OpeningStock', color: '#10b981' },
    { name: 'Item Inward', icon: ArrowDownLeft, route: 'ItemInward', color: '#f59e0b' },
    { name: 'Item Outward', icon: ArrowUpRight, route: 'ItemOutward', color: '#ef4444' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.appBar}>
        <View>
          <Text style={styles.welcomeText}>Hello,</Text>
          <Text style={styles.usernameText}>{user?.username || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color={Colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.text} />
        }
      >
        {/* Navigation grid */}
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity 
                key={index} 
                style={styles.menuCard}
                onPress={() => navigation.navigate(item.route)}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.color + '1a' }]}>
                  <Icon size={24} color={item.color} />
                </View>
                <Text style={styles.menuText}>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Closing Stock Report */}
        <Text style={styles.sectionTitle}>Closing Stock Report</Text>
        
        {loading && !refreshing ? (
          <Text style={styles.infoText}>Loading stock report...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : stockReport.length === 0 ? (
          <Text style={styles.infoText}>No stock data found.</Text>
        ) : (
        <View style={styles.stockGrid}>
          {stockReport.map((item, idx) => (
            <Card key={item.id || idx} style={styles.stockCard}>
              <View style={styles.stockCardHeader}>
                <Text style={styles.stockCardTitle} numberOfLines={1} ellipsizeMode="tail">
                  {item.name}
                </Text>
                <Package size={16} color={Colors.mutedForeground} />
              </View>
              <Text 
                style={[
                  styles.stockCardValue, 
                  { color: item.closing_stock > 0 ? Colors.text : Colors.destructive }
                ]}
              >
                {Number(item.closing_stock).toFixed(3)}
              </Text>
              <Text style={styles.stockCardSubtitle}>Item #{item.id}</Text>
            </Card>
          ))}
        </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.mutedForeground,
  },
  usernameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
  },
  scrollContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuCard: {
    backgroundColor: Colors.card,
    width: '47%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  menuText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stockCard: {
    width: '48%',
    marginBottom: 16,
    padding: 16,
  },
  stockCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
    marginRight: 4,
  },
  stockCardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  stockCardSubtitle: {
    fontSize: 12,
    color: Colors.mutedForeground,
    marginTop: 6,
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
});
