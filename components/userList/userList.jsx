import React from 'react';
import { Link } from 'react-router-dom';
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import axios from 'axios';
import './userList.css';

class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      loading: true,
      error: null,
      deleteDialogOpen: false,
      userToDelete: null,
    };
  }

  componentDidMount() {
    this.loadUsers();
  }

  loadUsers = () => {
    axios
      .get('/user/list')
      .then((response) => {
        this.setState({ users: response.data, loading: false });
      })
      .catch((err) => {
        console.error('Error fetching user list:', err);
        this.setState({
          error: err.response ? err.response.statusText : 'Network error',
          loading: false,
        });
      });
  };

  handleDeleteClick = (user) => {
    this.setState({ deleteDialogOpen: true, userToDelete: user });
  };

  handleCloseDialog = () => {
    this.setState({ deleteDialogOpen: false, userToDelete: null });
  };

  confirmDeleteUser = () => {
    const { userToDelete } = this.state;
    if (!userToDelete) return;

    axios
      .delete(`/user/${userToDelete._id}`)
      .then(() => {
        window.location.hash = '#/login-register';
        window.location.reload();
      })
      .catch((err) => {
        console.error('Failed to delete user:', err);
        this.setState({ error: err.response?.data?.error || 'Failed to delete user' });
        this.handleCloseDialog();
      });
  };

  render() {
    const { users, loading, error, deleteDialogOpen } = this.state;
    const loggedInUser = this.props.loggedInUser;

    if (loading) {
      return <Typography variant="body1">Loading users...</Typography>;
    }

    if (error) {
      return <Typography color="error">Error: {error}</Typography>;
    }

    return (
      <div className="user-list-container">
        <Typography variant="h6" sx={{ marginBottom: '8px' }}>
          Users
        </Typography>

        <List component="nav">
          {users.map((user, index) => (
            <React.Fragment key={user._id}>
              <ListItem
                className="user-list-item"
                secondaryAction={
                  loggedInUser && loggedInUser._id === user._id ? (
                    <Button
                      color="error"
                      size="small"
                      onClick={() => this.handleDeleteClick(user)}
                    >
                      Delete
                    </Button>
                  ) : null
                }
                button
                component={Link}
                to={`/users/${user._id}`}
              >
                <ListItemText primary={`${user.first_name} ${user.last_name}`} />
              </ListItem>
              {index !== users.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>

        {/* Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={this.handleCloseDialog}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete your account? This cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleCloseDialog}>Cancel</Button>
            <Button onClick={this.confirmDeleteUser} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

export default UserList;