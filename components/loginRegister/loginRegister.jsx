import React from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Divider,
    Alert
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
            // Login form fields
            loginName: '',
            loginPassword: '',
            
            // Registration form fields
            registerLoginName: '',
            registerPassword: '',
            registerPasswordConfirm: '',
            registerFirstName: '',
            registerLastName: '',
            registerLocation: '',
            registerDescription: '',
            registerOccupation: '',
            
            // Error and success messages
            loginError: '',
            registerError: '',
            registerSuccess: ''
        };
    }

    // Handle login form submission
    handleLogin = (e) => {
        e.preventDefault();
        const { loginName, loginPassword } = this.state;

        // Clear previous errors
        this.setState({ loginError: '' });

        // Validate inputs
        if (!loginName || !loginPassword) {
            this.setState({ loginError: 'Please enter both login name and password' });
            return;
        }

        // Send login request
        axios.post('/admin/login', {
            login_name: loginName,
            password: loginPassword
        })
        .then((response) => {
            // Login successful
            console.log('Login successful:', response.data);
            // Call parent callback to update app state
            if (this.props.onLoginSuccess) {
                this.props.onLoginSuccess(response.data);
            }
        })
        .catch((error) => {
            // Login failed
            console.error('Login error:', error);
            if (error.response && error.response.status === 400) {
                this.setState({ loginError: 'Invalid login name or password' });
            } else {
                this.setState({ loginError: 'Login failed. Please try again.' });
            }
        });
    };

    // Handle registration form submission
    handleRegister = (e) => {
        e.preventDefault();
        const {
            registerLoginName,
            registerPassword,
            registerPasswordConfirm,
            registerFirstName,
            registerLastName,
            registerLocation,
            registerDescription,
            registerOccupation
        } = this.state;

        // Clear previous messages
        this.setState({ registerError: '', registerSuccess: '' });

        // Validate inputs
        if (!registerLoginName || !registerPassword || !registerPasswordConfirm ||
            !registerFirstName || !registerLastName) {
            this.setState({ registerError: 'Login name, password, first name, and last name are required' });
            return;
        }

        // Check if passwords match
        if (registerPassword !== registerPasswordConfirm) {
            this.setState({ registerError: 'Passwords do not match' });
            return;
        }

        // Send registration request
        axios.post('/user', {
            login_name: registerLoginName,
            password: registerPassword,
            first_name: registerFirstName,
            last_name: registerLastName,
            location: registerLocation,
            description: registerDescription,
            occupation: registerOccupation
        })
        .then(() => {
            // Registration successful
            this.setState({
                registerSuccess: 'Registration successful! You can now log in.',
                // Clear form fields
                registerLoginName: '',
                registerPassword: '',
                registerPasswordConfirm: '',
                registerFirstName: '',
                registerLastName: '',
                registerLocation: '',
                registerDescription: '',
                registerOccupation: '',
                registerError: ''
            });
        })
        .catch((error) => {
            // Registration failed
            console.error('Registration error:', error);
            if (error.response && error.response.data) {
                this.setState({ registerError: error.response.data });
            } else {
                this.setState({ registerError: 'Registration failed. Please try again.' });
            }
        });
    };

    // Handle input changes
    handleInputChange = (field, value) => {
        this.setState({ [field]: value });
    };

    render() {
        const {
            loginName,
            loginPassword,
            registerLoginName,
            registerPassword,
            registerPasswordConfirm,
            registerFirstName,
            registerLastName,
            registerLocation,
            registerDescription,
            registerOccupation,
            loginError,
            registerError,
            registerSuccess
        } = this.state;

        return (
            <div className="login-register-container">
                <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 2 }}>
                    {/* Login Section */}
                    <Paper elevation={3} sx={{ padding: 3, marginBottom: 3 }}>
                        <Typography variant="h4" gutterBottom>
                            Login
                        </Typography>
                        <Box component="form" onSubmit={this.handleLogin} noValidate>
                            {loginError && (
                                <Alert severity="error" sx={{ marginBottom: 2 }}>
                                    {loginError}
                                </Alert>
                            )}
                            <TextField
                                label="Login Name"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={loginName}
                                onChange={(e) => this.handleInputChange('loginName', e.target.value)}
                            />
                            <TextField
                                label="Password"
                                type="password"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={loginPassword}
                                onChange={(e) => this.handleInputChange('loginPassword', e.target.value)}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ marginTop: 2 }}
                            >
                                Login
                            </Button>
                        </Box>
                    </Paper>

                    <Divider sx={{ marginY: 3 }} />

                    {/* Registration Section */}
                    <Paper elevation={3} sx={{ padding: 3 }}>
                        <Typography variant="h4" gutterBottom>
                            Register New Account
                        </Typography>
                        <Box component="form" onSubmit={this.handleRegister} noValidate>
                            {registerError && (
                                <Alert severity="error" sx={{ marginBottom: 2 }}>
                                    {registerError}
                                </Alert>
                            )}
                            {registerSuccess && (
                                <Alert severity="success" sx={{ marginBottom: 2 }}>
                                    {registerSuccess}
                                </Alert>
                            )}
                            <TextField
                                label="Login Name"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                required
                                value={registerLoginName}
                                onChange={(e) => this.handleInputChange('registerLoginName', e.target.value)}
                            />
                            <TextField
                                label="Password"
                                type="password"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                required
                                value={registerPassword}
                                onChange={(e) => this.handleInputChange('registerPassword', e.target.value)}
                            />
                            <TextField
                                label="Confirm Password"
                                type="password"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                required
                                value={registerPasswordConfirm}
                                onChange={(e) => this.handleInputChange('registerPasswordConfirm', e.target.value)}
                            />
                            <TextField
                                label="First Name"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                required
                                value={registerFirstName}
                                onChange={(e) => this.handleInputChange('registerFirstName', e.target.value)}
                            />
                            <TextField
                                label="Last Name"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                required
                                value={registerLastName}
                                onChange={(e) => this.handleInputChange('registerLastName', e.target.value)}
                            />
                            <TextField
                                label="Location"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={registerLocation}
                                onChange={(e) => this.handleInputChange('registerLocation', e.target.value)}
                            />
                            <TextField
                                label="Description"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                multiline
                                rows={3}
                                value={registerDescription}
                                onChange={(e) => this.handleInputChange('registerDescription', e.target.value)}
                            />
                            <TextField
                                label="Occupation"
                                variant="outlined"
                                fullWidth
                                margin="normal"
                                value={registerOccupation}
                                onChange={(e) => this.handleInputChange('registerOccupation', e.target.value)}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                fullWidth
                                sx={{ marginTop: 2 }}
                            >
                                Register Me
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </div>
        );
    }
}

export default LoginRegister;
