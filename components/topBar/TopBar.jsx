import React from 'react';
import {
    AppBar, Toolbar, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Box
} from '@mui/material';
import './TopBar.css';
import axios from 'axios';

/**
 * Define TopBar, a React componment of project #5
 */
class TopBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app_info: undefined,
            uploadDialogOpen: false,
            uploading: false,
            uploadError: null,
            uploadSuccess: false,
            loggedInUser: null
        };
        this.uploadInput = null;
    }

    componentDidMount() {
        this.handleAppInfoChange();
        // Check if user is logged in (passed from parent)
        if (this.props.loggedInUser) {
            this.setState({ loggedInUser: this.props.loggedInUser });
        }
    }

    componentDidUpdate(prevProps) {
        // Update logged in user when props change
        if (prevProps.loggedInUser !== this.props.loggedInUser) {
            this.setState({ loggedInUser: this.props.loggedInUser });
        }
    }

    handleLogout = () => {
        axios.post('/admin/logout')
            .then(() => {
                this.setState({ loggedInUser: null });
                // Notify parent component
                if (this.props.onLogout) {
                    this.props.onLogout();
                }
                // Navigate to login page
                window.location.hash = '#/login-register';
            })
            .catch((err) => {
                console.error('Logout error:', err);
            });
    }

    handleOpenUploadDialog = () => {
        this.setState({
            uploadDialogOpen: true,
            uploadError: null,
            uploadSuccess: false
        });
    }

    handleCloseUploadDialog = () => {
        this.setState({
            uploadDialogOpen: false,
            uploadError: null,
            uploadSuccess: false
        });
        // Reset file input
        if (this.uploadInput) {
            this.uploadInput.value = '';
        }
    }

    handleUploadButtonClicked = (e) => {
        e.preventDefault();
        
        if (!this.uploadInput || !this.uploadInput.files || this.uploadInput.files.length === 0) {
            this.setState({
                uploadError: 'Please select a file to upload'
            });
            return;
        }

        this.setState({
            uploading: true,
            uploadError: null,
            uploadSuccess: false
        });

        // Create a DOM form and add the file to it under the name uploadedphoto
        const domForm = new FormData();
        domForm.append('uploadedphoto', this.uploadInput.files[0]);

        axios.post('/photos/new', domForm)
            .then((res) => {
                const userId = res.data.user_id;
                this.setState({
                    uploading: false,
                    uploadSuccess: true,
                    uploadError: null
                });
                // Close dialog after a short delay to show success message
                setTimeout(() => {
                    this.handleCloseUploadDialog();
                    // Navigate to the user's photos page to show the newly uploaded photo
                    if (userId) {
                        const currentHash = window.location.hash;
                        const targetHash = `#/photos/${userId}`;
                        
                        if (currentHash === targetHash) {
                            // If already on the photos page, force a reload by navigating away and back
                            window.location.hash = `#/users/${userId}`;
                            setTimeout(() => {
                                window.location.hash = targetHash;
                            }, 50);
                        } else {
                            // Navigate to the photos page - UserPhotos will load automatically
                            window.location.hash = targetHash;
                        }
                    }
                }, 1500);
            })
            .catch((err) => {
                const errorMessage = err.response
                    ? err.response.data?.error || `Failed to upload photo: ${err.response.statusText || err.response.status}`
                    : `Failed to upload photo: ${err.message}`;
                this.setState({
                    uploading: false,
                    uploadError: errorMessage,
                    uploadSuccess: false
                });
            });
    }

    handleAppInfoChange(){
        const app_info = this.state.app_info;
        if (app_info === undefined){
            axios.get("/test/info")
                .then((response) =>
                {
                    this.setState({
                        app_info: response.data
                    });
                });
        }
    }

  render() {
    return this.state.app_info ? (
      <>
        <AppBar className="topbar-appBar" position="absolute">
          <Toolbar>
              <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>Todd Dobbs</Typography>
              <Typography variant="h5" component="div" sx={{ flexGrow: 1 }} color="inherit">{this.props.main_content}</Typography>
              
              {this.state.loggedInUser ? (
                <>
                  <Typography variant="body1" sx={{ mr: 2 }}>
                    Hi {this.state.loggedInUser.first_name}
                  </Typography>
                  <Button 
                    color="inherit" 
                    onClick={this.handleOpenUploadDialog}
                    sx={{ mr: 2 }}
                  >
                    Add Photo
                  </Button>
                  <Button 
                    color="inherit" 
                    onClick={this.handleLogout}
                    sx={{ mr: 2 }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Typography variant="body1" sx={{ mr: 2 }}>
                  Please Login
                </Typography>
              )}
              
              <Typography variant="h5" component="div" color="inherit">Version: {this.state.app_info.version}</Typography>
          </Toolbar>
        </AppBar>

        <Dialog open={this.state.uploadDialogOpen} onClose={this.handleCloseUploadDialog}>
          <DialogTitle>Upload a New Photo</DialogTitle>
          <DialogContent>
            <Box sx={{ minWidth: 400, pt: 1 }}>
              {this.state.uploadError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {this.state.uploadError}
                </Alert>
              )}
              {this.state.uploadSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Photo uploaded successfully!
                </Alert>
              )}
              <input
                type="file"
                accept="image/*"
                ref={(domFileRef) => { this.uploadInput = domFileRef; }}
                disabled={this.state.uploading}
                style={{ marginBottom: '16px', width: '100%' }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseUploadDialog} disabled={this.state.uploading}>
              Cancel
            </Button>
            <Button 
              onClick={this.handleUploadButtonClicked} 
              variant="contained"
              disabled={this.state.uploading}
            >
              {this.state.uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    ) : (
        <div/>
    );
  }
}

export default TopBar;
