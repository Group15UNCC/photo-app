import React from 'react';
import {
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardMedia
} from '@mui/material';
import fetchModel from '../../lib/fetchModelData';
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

    fetchModel(`/photosOfUser/${userId}`)
      .then((response) => {
        this.setState({
          photos: response.data,
          loading: false
        });
      })
      .catch((err) => {
        this.setState({
          error: `Failed to load photos: ${err.statusText}`,
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

              {/* Optional: render comments if available */}
              {photo.comments && photo.comments.length > 0 && (
                <div className="photo-comments">
                  <Typography variant="subtitle2">Comments:</Typography>
                  {photo.comments.map((comment) => (
                    <Typography key={comment._id} variant="body2">
                      <strong>{comment.user?.first_name}</strong>: {comment.comment}
                    </Typography>
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