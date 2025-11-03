import React from 'react';
import {
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import axios from 'axios';
import './userPhotos.css';

/**
 * Define UserPhotos, a React component of project #5
 */
class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: null,
      loading: true,
      error: null
    };
  }

  componentDidMount() {
    this.loadUserPhotos();
  }

  componentDidUpdate(prevProps) {
    // If userId changes (navigating between users), refetch
    if (prevProps.match.params.userId !== this.props.match.params.userId) {
      this.loadUserPhotos();
    }
  }

  loadUserPhotos() {
    const userId = this.props.match.params.userId;
    this.setState({ loading: true, error: null });

    axios.get(`/photosOfUser/${userId}`)
      .then((response) => {
        this.setState({
          photos: response.data,
          loading: false
        });
      })
      .catch((err) => {
        const errorMessage = err.response
          ? `Failed to load photos: ${err.response.statusText || err.response.status}`
          : `Failed to load photos: ${err.message}`;
        this.setState({
          error: errorMessage,
          loading: false
        });
      });
  }

  render() {
    const { photos, loading, error } = this.state;
    const userId = this.props.match.params.userId;

    if (loading) {
      return (
        <div className="userPhotos-container">
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 1 }}>
            Loading photos for user {userId}...
          </Typography>
        </div>
      );
    }

    if (error) {
      return (
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      );
    }

    if (!photos || photos.length === 0) {
      return (
        <Typography variant="body1">
          No photos found for user {userId}.
        </Typography>
      );
    }

    return (
      <div className="userPhotos-container">
        <Typography variant="h6" gutterBottom>
          Photos of User {userId}
        </Typography>

        {photos.map((photo) => (
          <Card key={photo._id} className="userPhotos-card">
            {photo.file_name && (
              <CardMedia
                component="img"
                image={`../images/${photo.file_name}`}
                alt={photo.file_name}
                className="userPhotos-image"
              />
            )}
            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Uploaded on: {new Date(photo.date_time).toLocaleString()}
              </Typography>

              {/* Render comments if available */}
              {photo.comments && photo.comments.length > 0 && (
                <div className="photo-comments">
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Comments:
                  </Typography>
                  {photo.comments.map((comment) => (
                    <div key={comment._id} className="comment-item">
                      <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                        {new Date(comment.date_time).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {comment.user ? (
                          <>
                            <a 
                              href={`#/users/${comment.user._id}`}
                              style={{ textDecoration: 'none', color: 'primary.main' }}
                            >
                              {comment.user.first_name} {comment.user.last_name}
                            </a>: {comment.comment}
                          </>
                        ) : (
                          <span>Unknown User: {comment.comment}</span>
                        )}
                      </Typography>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}

export default UserPhotos;