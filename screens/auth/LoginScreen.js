import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Box } from 'lucide-react-native';
import api from '../../services/api';
import { AuthContext } from '../../services/authContext';
import { Colors, Card, Input, Button } from '../../components/UI';

export default function LoginScreen({ navigation }) {
  const { signIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ username: '', password: '' });

  const handleLogin = async () => {
    // Custom Validation
    let hasError = false;
    const errors = { username: '', password: '' };

    if (!username.trim()) {
      errors.username = 'Username is required';
      hasError = true;
    }

    if (!password) {
      errors.password = 'Password is required';
      hasError = true;
    }

    setValidationErrors(errors);

    if (hasError) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;

      if (data.status) {
        signIn(data.data.accessToken, data.data.user);
        // The global signIn updates App.js state, which automatically transitions navigation to Dashboard.
        // If you ever switch to non-conditional stack routes, use:
        // navigation.replace('Dashboard');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Network error. Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Card style={styles.card}>
            <View style={styles.header}>
              <Box size={48} color={Colors.text} style={styles.logo} />
              <Text style={styles.title}>Welcome</Text>
              <Text style={styles.subtitle}>Enter your credentials to access the dashboard.</Text>
            </View>

            {error ? (
              <View style={styles.errorAlert}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Username"
              placeholder="Enter Username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (validationErrors.username) setValidationErrors({ ...validationErrors, username: '' });
              }}
              error={validationErrors.username}
            />

            <Input
              label="Password"
              placeholder="Enter Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
              }}
              secureTextEntry
              error={validationErrors.password}
            />

            <Button 
              onPress={handleLogin} 
              loading={loading}
              style={styles.loginBtn}
            >
              Sign In
            </Button>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mutedForeground,
    textAlign: 'center',
    marginTop: 6,
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Colors.destructive,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.destructive,
    fontSize: 14,
    textAlign: 'center',
  },
  loginBtn: {
    marginTop: 8,
  },
});
