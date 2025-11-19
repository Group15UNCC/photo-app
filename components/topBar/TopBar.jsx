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
        this.uploadInput = null;
    }

    componentDidMount() {
        this.handleAppInfoChange();
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

    handleUploadButtonClicked = (e) => {
        e.preventDefault();
        if (this.uploadInput && this.uploadInput.files.length > 0) {
            const domForm = new FormData();
            domForm.append("uploadedphoto", this.uploadInput.files[0]);

            axios.post("/photos/new", domForm)
                .then((res) => {
                    console.log("Upload success:", res.data);
                })
                .catch((err) => {
                    console.error("Upload error:", err);
                });
        }
    };

    render() {
        return this.state.app_info ? (
            <AppBar className="topbar-appBar" position="absolute">
                <Toolbar>

                    <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>Brown University</Typography>
                    <Typography variant="h5" component="div" sx={{ flexGrow: 1 }} color="inherit">{this.props.main_content}</Typography>

                    {/* ----- Hidden File Input ----- */}
                    <input
                        type="file"
                        accept="image/*"
                        ref={(ref) => { this.uploadInput = ref; }}
                        style={{ display: "none" }}
                    />

                    {/* ----- Add Photo Button ----- */}
                    <Button
                        color="inherit"
                        onClick={() => this.uploadInput && this.uploadInput.click()}
                        sx={{ marginRight: "16px" }}
                    >
                        Add Photo
                    </Button>

                    {/* ----- Upload Button ----- */}
                    <Button
                        color="inherit"
                        onClick={this.handleUploadButtonClicked}
                        sx={{ marginRight: "16px" }}
                    >
                        Upload
                    </Button>

                    <Typography variant="h5" component="div" color="inherit">Version: {this.state.app_info.version}</Typography>
                </Toolbar>
            </AppBar>
        ) : (
            <div />
        );
    }
}

export default TopBar;
