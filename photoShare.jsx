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
      loggedInUser: null
    };
  }

  componentDidMount() {
    // Check if user is already logged in (session check)
    this.checkLoginStatus();
  }

  checkLoginStatus = () => {
    axios.get('/admin/current')
      .then((res) => {
        if (res.data.loggedIn) {
          this.setState({ loggedInUser: res.data });
        } else {
          this.setState({ loggedInUser: null });
        }
      })
      .catch(() => {
        this.setState({ loggedInUser: null });
      });
  };

  handleLoginSuccess = (user) => {
    this.setState({ loggedInUser: user });
  };

  handleLogout = () => {
    this.setState({ loggedInUser: null });
  };

  render() {
    return (
      <HashRouter>
      <div>
      <Grid container spacing={8}>
        <Grid item xs={12}>
          <TopBar 
            loggedInUser={this.state.loggedInUser}
            onLogout={this.handleLogout}
          />
        </Grid>
        <div className="main-topbar-buffer"/>
        {this.state.loggedInUser && (
          <Grid item sm={3}>
            <Paper className="main-grid-item">
              <UserList />
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