import React from 'react';
import {
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  TextField,
  Button,
  Alert
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
      error: null,
      commentTexts: {},
      submitErrors: {},
      submitting: {},
      successMessage: ''
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
    this.setState({
      loading: true,
      error: null,
      successMessage: '',
      submitErrors: {}
    });

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

  handleCommentTextChange = (photoId, value) => {
    this.setState((prevState) => ({
      commentTexts: {
        ...prevState.commentTexts,
        [photoId]: value
      },
      submitErrors: {
        ...prevState.submitErrors,
        [photoId]: ''
      },
      successMessage: ''
    }));
  };

  handleCommentSubmit = (photoId) => {
    const commentText = (this.state.commentTexts[photoId] || '').trim();

    if (!commentText) {
      this.setState((prevState) => ({
        submitErrors: {
          ...prevState.submitErrors,
          [photoId]: 'Please enter a comment before submitting.'
        }
      }));
      return;
    }

    const { currentUser } = this.props;
    const userId = currentUser ? currentUser._id : null;

    if (!userId) {
      this.setState((prevState) => ({
        submitErrors: {
          ...prevState.submitErrors,
          [photoId]: 'You must be logged in to comment.'
        }
      }));
      return;
    }

    this.setState((prevState) => ({
      submitting: {
        ...prevState.submitting,
        [photoId]: true
      },
      submitErrors: {
        ...prevState.submitErrors,
        [photoId]: ''
      },
      successMessage: ''
    }));

    axios.post(`/commentsOfPhoto/${photoId}`, {
      comment: commentText,
      user_id: userId
    })
      .then((response) => {
        this.setState((prevState) => {
          const updatedPhotos = prevState.photos ? prevState.photos.map((photo) => {
            if (photo._id !== photoId) {
              return photo;
            }
            return {
              ...photo,
              comments: [
                ...(photo.comments || []),
                {
                  ...response.data
                }
              ]
            };
          }) : prevState.photos;

          return {
            photos: updatedPhotos,
            commentTexts: {
              ...prevState.commentTexts,
              [photoId]: ''
            },
            submitting: {
              ...prevState.submitting,
              [photoId]: false
            },
            successMessage: 'Comment added successfully!'
          };
        });
      })
      .catch((err) => {
        const errorMessage = err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : 'Failed to add comment.';

        this.setState((prevState) => ({
          submitErrors: {
            ...prevState.submitErrors,
            [photoId]: errorMessage
          },
          submitting: {
            ...prevState.submitting,
            [photoId]: false
          }
        }));
      });
  };

  render() {
    const { photos, loading, error, commentTexts, submitErrors, submitting, successMessage } = this.state;
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
        {successMessage ? (
          <Alert severity="success" className="comment-success-alert">
            {successMessage}
          </Alert>
        ) : null}
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
            <CardActions className="comment-form">
              <TextField
                label="Add a comment"
                variant="outlined"
                size="small"
                fullWidth
                value={commentTexts[photo._id] || ''}
                onChange={(event) => this.handleCommentTextChange(photo._id, event.target.value)}
                inputProps={{ maxLength: 500 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => this.handleCommentSubmit(photo._id)}
                disabled={Boolean(submitting[photo._id])}
              >
                {submitting[photo._id] ? 'Posting...' : 'Post'}
              </Button>
            </CardActions>
            {submitErrors[photo._id] ? (
              <Typography color="error" variant="body2" sx={{ mt: 1, px: 2 }}>
                {submitErrors[photo._id]}
              </Typography>
            ) : null}
          </Card>
        ))}
      </div>
    );
  }
}

export default UserPhotos;