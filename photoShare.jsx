import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter, Route, Switch, Redirect
} from 'react-router-dom';
import {
  Grid, Typography, Paper
} from '@mui/material';
import axios from 'axios';
import './styles/main.css';

// import necessary components
import TopBar from './components/topBar/TopBar';
import UserDetail from './components/userDetail/userDetail';
import UserList from './components/userList/userList';
import UserPhotos from './components/userPhotos/userPhotos';
import LoginRegister from './components/loginRegister/loginRegister';

class PhotoShare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loggedInUser: null,
      checkingLogin: true
    };
  }

  componentDidMount() {
    this.checkLoginStatus();
  }

  checkLoginStatus = () => {
    axios.get('/admin/current')
      .then((res) => {
        if (res.data && res.data.loggedIn && res.data.user) {
          this.setState({ loggedInUser: res.data.user, checkingLogin: false });
        } else {
          this.setState({ loggedInUser: null, checkingLogin: false });
        }
      })
      .catch(() => {
        this.setState({ loggedInUser: null, checkingLogin: false });
      });
  };

  handleLoginSuccess = (user) => {
    this.setState({ loggedInUser: user });
  };

  handleLogout = () => {
    this.setState({ loggedInUser: null });
  };

  render() {
    if (this.state.checkingLogin) {
      return (
        <Typography variant="h6" sx={{ padding: 2 }}>
          Checking login session...
        </Typography>
      );
    }
    return (
      <HashRouter>
        <div>
          <TopBar
            loggedInUser={this.state.loggedInUser}
            onLogout={this.handleLogout}
          />
          <div className="main-topbar-buffer" />
          <Grid container spacing={8}>
            {this.state.loggedInUser && (
              <Grid item sm={3}>
                <Paper className="main-grid-item">
                  <UserList loggedInUser={this.state.loggedInUser} />
                </Paper>
              </Grid>
            )}
            <Grid item sm={this.state.loggedInUser ? 9 : 12}>
              <Paper className="main-grid-item">
                <Switch>
                  <Route path="/login-register"
                    render={props => (
                      <LoginRegister
                        {...props}
                        onLoginSuccess={this.handleLoginSuccess}
                      />
                    )}
                  />
                  <Route exact path="/"
                    render={() => (
                      this.state.loggedInUser ? (
                        <Typography variant="body1">
                          Welcome to your photosharing app!
                        </Typography>
                      ) : (
                        <Redirect to="/login-register" />
                      )
                    )}
                  />
                  <Route path="/users/:userId"
                    render={props => (
                      this.state.loggedInUser ? (
                        <UserDetail {...props} />
                      ) : (
                        <Redirect to="/login-register" />
                      )
                    )}
                  />
                  <Route path="/photos/:userId"
                    render={props => (
                      this.state.loggedInUser ? (
                        <UserPhotos {...props} currentUser={this.state.loggedInUser} />
                      ) : (
                        <Redirect to="/login-register" />
                      )
                    )}
                  />
                  <Route path="/users"
                    render={props => (
                      this.state.loggedInUser ? (
                        <UserList {...props} />
                      ) : (
                        <Redirect to="/login-register" />
                      )
                    )}
                  />
                  <Route render={() => <Redirect to="/login-register" />} />
                </Switch>
              </Paper>
            </Grid>
          </Grid>
        </div>
      </HashRouter>
    );
  }
}

ReactDOM.render(
  <PhotoShare />,
  document.getElementById('photoshareapp'),
);