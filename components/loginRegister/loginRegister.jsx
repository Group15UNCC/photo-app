import React from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper
} from '@mui/material';
import axios from 'axios';
import './loginRegister.css';

/**
 * Define LoginRegister, a React component for user login and registration
 */
class LoginRegister extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Login state
      login_name: '',
      login_password: '',
      // Registration state
      reg_login_name: '',
      reg_password: '',
      reg_confirm_password: '',
      reg_first_name: '',
      reg_last_name: '',
      reg_location: '',
      reg_description: '',
      reg_occupation: '',
      // UI state
      loginError: null,
      regError: null,
      regSuccess: false,
      loading: false,
      registering: false
    };
  }

  handleLoginNameChange = (e) => {
    this.setState({
      login_name: e.target.value,
      loginError: null
    });
  };

  handleLoginPasswordChange = (e) => {
    this.setState({
      login_password: e.target.value,
      loginError: null
    });
  };

  handleLogin = (e) => {
    e.preventDefault();
    const { login_name, login_password } = this.state;

    if (!login_name || !login_name.trim()) {
      this.setState({ loginError: 'Please enter a login name' });
      return;
    }

    if (!login_password || !login_password.trim()) {
      this.setState({ loginError: 'Please enter a password' });
      return;
    }

    this.setState({ loading: true, loginError: null });

    axios.post('/admin/login', { 
      login_name: login_name.trim(),
      password: login_password
    })
      .then((response) => {
        // Login successful - user info is in response.data
        const user = response.data;
        this.setState({ loading: false });
        // Notify parent component about successful login
        if (this.props.onLoginSuccess) {
          this.props.onLoginSuccess(user);
        }
        // Navigate to user's detail page after state update
        setTimeout(() => {
          window.location.hash = `#/users/${user._id}`;
        }, 0);
      })
      .catch((err) => {
        const errorMessage = err.response
          ? err.response.data?.error || `Login failed: ${err.response.statusText || err.response.status}`
          : `Login failed: ${err.message}`;
        this.setState({
          loginError: errorMessage,
          loading: false
        });
      });
  };

  handleRegistrationFieldChange = (field) => (e) => {
    this.setState({
      [field]: e.target.value,
      regError: null,
      regSuccess: false
    });
  };

  handleRegister = (e) => {
    e.preventDefault();
    const {
      reg_login_name,
      reg_password,
      reg_confirm_password,
      reg_first_name,
      reg_last_name,
      reg_location,
      reg_description,
      reg_occupation
    } = this.state;

    // Validate required fields
    if (!reg_login_name || !reg_login_name.trim()) {
      this.setState({ regError: 'Login name is required' });
      return;
    }

    if (!reg_password || !reg_password.trim()) {
      this.setState({ regError: 'Password is required' });
      return;
    }

    if (!reg_first_name || !reg_first_name.trim()) {
      this.setState({ regError: 'First name is required' });
      return;
    }

    if (!reg_last_name || !reg_last_name.trim()) {
      this.setState({ regError: 'Last name is required' });
      return;
    }

    // Check password confirmation
    if (reg_password !== reg_confirm_password) {
      this.setState({ regError: 'Passwords do not match' });
      return;
    }

    this.setState({ registering: true, regError: null, regSuccess: false });

    axios.post('/user', {
      login_name: reg_login_name.trim(),
      password: reg_password,
      first_name: reg_first_name.trim(),
      last_name: reg_last_name.trim(),
      location: reg_location.trim(),
      description: reg_description.trim(),
      occupation: reg_occupation.trim()
    })
      .then(() => {
        this.setState({
          registering: false,
          regSuccess: true,
          regError: null,
          // Clear registration form
          reg_login_name: '',
          reg_password: '',
          reg_confirm_password: '',
          reg_first_name: '',
          reg_last_name: '',
          reg_location: '',
          reg_description: '',
          reg_occupation: ''
        });
      })
      .catch((err) => {
        const errorMessage = err.response
          ? err.response.data?.error || `Registration failed: ${err.response.statusText || err.response.status}`
          : `Registration failed: ${err.message}`;
        this.setState({
          regError: errorMessage,
          registering: false,
          regSuccess: false
        });
      });
  };

  render() {
    const {
      login_name,
      login_password,
      reg_login_name,
      reg_password,
      reg_confirm_password,
      reg_first_name,
      reg_last_name,
      reg_location,
      reg_description,
      reg_occupation,
      loginError,
      regError,
      regSuccess,
      loading,
      registering
    } = this.state;

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '400px', pt: 4 }}>
        <Paper sx={{ p: 4, maxWidth: 500, width: '100%' }}>
          {/* Login Section */}
          <Typography variant="h5" gutterBottom>
            Login
          </Typography>
          
          {loginError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Box component="form" onSubmit={this.handleLogin}>
            <TextField
              fullWidth
              label="Login Name"
              variant="outlined"
              value={login_name}
              onChange={this.handleLoginNameChange}
              disabled={loading}
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={login_password}
              onChange={this.handleLoginPasswordChange}
              disabled={loading}
              margin="normal"
            />
            
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !login_name.trim() || !login_password.trim()}
              sx={{ mt: 2 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Box>

          <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid #e0e0e0' }}>
            {/* Registration Section */}
            <Typography variant="h5" gutterBottom>
              Register New User
            </Typography>

            {regError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {regError}
              </Alert>
            )}

            {regSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Registration successful! You can now login with your new account.
              </Alert>
            )}

            <Box component="form" onSubmit={this.handleRegister}>
              <TextField
                fullWidth
                label="Login Name"
                variant="outlined"
                value={reg_login_name}
                onChange={this.handleRegistrationFieldChange('reg_login_name')}
                disabled={registering}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                variant="outlined"
                value={reg_password}
                onChange={this.handleRegistrationFieldChange('reg_password')}
                disabled={registering}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                variant="outlined"
                value={reg_confirm_password}
                onChange={this.handleRegistrationFieldChange('reg_confirm_password')}
                disabled={registering}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="First Name"
                variant="outlined"
                value={reg_first_name}
                onChange={this.handleRegistrationFieldChange('reg_first_name')}
                disabled={registering}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Last Name"
                variant="outlined"
                value={reg_last_name}
                onChange={this.handleRegistrationFieldChange('reg_last_name')}
                disabled={registering}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Location"
                variant="outlined"
                value={reg_location}
                onChange={this.handleRegistrationFieldChange('reg_location')}
                disabled={registering}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                multiline
                rows={3}
                value={reg_description}
                onChange={this.handleRegistrationFieldChange('reg_description')}
                disabled={registering}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Occupation"
                variant="outlined"
                value={reg_occupation}
                onChange={this.handleRegistrationFieldChange('reg_occupation')}
                disabled={registering}
                margin="normal"
              />
              
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={registering}
                sx={{ mt: 2 }}
              >
                {registering ? 'Registering...' : 'Register Me'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }
}

export default LoginRegister;
