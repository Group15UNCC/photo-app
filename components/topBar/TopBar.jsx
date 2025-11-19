import React from 'react';
import {
    AppBar, Toolbar, Typography, Button
} from '@mui/material';
import './TopBar.css';
import axios from 'axios';

class TopBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app_info: undefined
        };
        this.uploadInput = React.createRef();
    }

    componentDidMount() {
        this.handleAppInfoChange();
    }

    handleAppInfoChange() {
        if (!this.state.app_info) {
            axios.get("/test/info")
                .then((response) => {
                    this.setState({
                        app_info: response.data
                    });
                });
        }
    }

    handleFileSelected = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('uploadedphoto', file);

        axios.post('/photos/new', formData)
            .then((res) => {
                console.log("Upload successful:", res.data);
                alert("Photo uploaded successfully!");

                if (this.props.onPhotoUploaded) {
                    this.props.onPhotoUploaded();
                }
            })
            .catch(err => {
                console.error("Upload error:", err);
                alert("Photo upload failed!");
            });
    };

    handleAddPhotoClick = () => {
        this.uploadInput.current.click();
    };

    render() {
        return this.state.app_info ? (
            <AppBar className="topbar-appBar" position="absolute">
                <Toolbar>
                    <Typography variant="h5" sx={{ flexGrow: 1 }}>Brown University</Typography>
                        <Typography variant="h5" sx={{ flexGrow: 1 }}>{this.props.main_content}</Typography>
                        <Button color="inherit" onClick={this.handleAddPhotoClick}>Add Photo</Button>
                        <Typography variant="h6" sx={{ mr: 2 }}>Version: {this.state.app_info.version}</Typography>
                    <input
                        type="file"
                        accept="image/*"
                        ref={this.uploadInput}
                        style={{ display: 'none' }}
                        onChange={this.handleFileSelected}
                    />
                    
                </Toolbar>
            </AppBar>
        ) : (
            <div />
        );
    }
}

export default TopBar;
