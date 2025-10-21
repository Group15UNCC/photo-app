import React from 'react';
import { Link } from 'react-router-dom';
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import fetchModel from '../../lib/fetchModelData';
import './userList.css';

class UserList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    // Fetch users from the backend
    fetchModel('/user/list')
      .then((response) => {
        this.setState({ users: response.data, loading: false });
      })
      .catch((err) => {
        console.error('Error fetching user list:', err);
        this.setState({ error: err.statusText, loading: false });
      });
  }

  render() {
    const { users, loading, error } = this.state;

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
                button
                component={Link}
                to={`/users/${user._id}`}
                className="user-list-item"
              >
                <ListItemText
                  primary={`${user.first_name} ${user.last_name}`}
                />
              </ListItem>
              {index !== users.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </div>
    );
  }
}

export default UserList;
