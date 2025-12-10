import React from 'react';
import {
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import axios from 'axios';
import './userPhotos.css';

class UserPhotos extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      photos: null,
      loading: true,
      error: null,
      commentTexts: {}, 
      submittingComment: {}, 
      commentError: {},
      deletingPhoto: {},
      deletingComment: {}
    };
  }

  componentDidMount() {
    this.loadUserPhotos();
  }

  componentDidUpdate(prevProps) {
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

  handleCommentChange = (photoId, value) => {
    this.setState(prevState => ({
      commentTexts: {
        ...prevState.commentTexts,
        [photoId]: value
      },
      commentError: {
        ...prevState.commentError,
        [photoId]: null
      }
    }));
  };

  handleAddComment = (photoId) => {
    const commentText = this.state.commentTexts[photoId] || '';

    if (!commentText.trim()) {
      this.setState(prevState => ({
        commentError: {
          ...prevState.commentError,
          [photoId]: 'Comment cannot be empty'
        }
      }));
      return;
    }

    this.setState(prevState => ({
      submittingComment: {
        ...prevState.submittingComment,
        [photoId]: true
      }
    }));

    axios.post(`/commentsOfPhoto/${photoId}`, {
      comment: commentText
    })
      .then(() => {
        this.setState(prevState => ({
          commentTexts: {
            ...prevState.commentTexts,
            [photoId]: ''
          },
          submittingComment: {
            ...prevState.submittingComment,
            [photoId]: false
          }
        }));
        this.loadUserPhotos();
      })
      .catch((err) => {
        const errorMessage = err.response
          ? err.response.data?.error || `Failed to add comment`
          : `Failed to add comment: ${err.message}`;

        this.setState(prevState => ({
          commentError: {
            ...prevState.commentError,
            [photoId]: errorMessage
          },
          submittingComment: {
            ...prevState.submittingComment,
            [photoId]: false
          }
        }));
      });
  };

  handleDeletePhoto = (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    this.setState(prevState => ({
      deletingPhoto: {
        ...prevState.deletingPhoto,
        [photoId]: true
      }
    }));

    axios.delete(`/photos/${photoId}`)
      .then(() => {
        this.loadUserPhotos();
      })
      .catch(err => {
        alert("Failed to delete photo");
      })
      .finally(() => {
        this.setState(prevState => ({
          deletingPhoto: {
            ...prevState.deletingPhoto,
            [photoId]: false
          }
        }));
      });
  };

  handleDeleteComment = (photoId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    this.setState(prevState => ({
      deletingComment: {
        ...prevState.deletingComment,
        [commentId]: true
      }
    }));

    // Fix: Use the correct endpoint that matches the backend
    axios.delete(`/comments/${photoId}/${commentId}`)
      .then(() => {
        this.loadUserPhotos();
      })
      .catch(err => {
        alert("Failed to delete comment");
      })
      .finally(() => {
        this.setState(prevState => ({
          deletingComment: {
            ...prevState.deletingComment,
            [commentId]: false
          }
        }));
      });
  };

  // Helper function to convert URLs in text to clickable links
  renderTextWithLinks = (text) => {
    if (!text) return text;
    
    // URL regex pattern - matches http://, https://, www., and common TLDs
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before the URL
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Process the URL
      let url = match[0];
      let href = url;

      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        href = 'https://' + url;
      }

      // Create clickable link
      parts.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1976d2', textDecoration: 'underline' }}
        >
          {url}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last URL
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // If no URLs were found, return original text
    return parts.length > 0 ? parts : text;
  };

  render() {
    const { photos, loading, error } = this.state;
    const userId = this.props.match.params.userId;
    const currentUser = this.props.currentUser;

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
      return <Typography color="error">{error}</Typography>;
    }

    if (!photos || photos.length === 0) {
      return <Typography>No photos found for user {userId}.</Typography>;
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
            {currentUser && currentUser._id === photo.user_id && (
              <Button
                color="error"
                variant="contained"
                size="small"
                sx={{ mt: 1 }}
                onClick={() => this.handleDeletePhoto(photo._id)}
                disabled={this.state.deletingPhoto[photo._id]}
              >
                {this.state.deletingPhoto[photo._id] ? "Deleting..." : "Delete Photo"}
              </Button>
            )}

            <CardContent>
              <Typography variant="body2" color="textSecondary">
                Uploaded on: {new Date(photo.date_time).toLocaleString()}
              </Typography>

              {photo.comments.length > 0 && (
                <div className="photo-comments">
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Comments:
                  </Typography>

                  {photo.comments.map((comment) => {
                    const canDeleteComment =
                      currentUser &&
                      (currentUser._id === comment.user._id ||
                        currentUser._id === photo.user_id);

                    return (
                      <div key={comment._id} className="comment-item">
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                          {new Date(comment.date_time).toLocaleString()}
                        </Typography>

                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {comment.user ? (
                            <>
                              <a 
                                href={`#/users/${comment.user._id}`}
                                style={{ textDecoration: 'none' }}
                              >
                                {comment.user.first_name} {comment.user.last_name}
                              </a>
                              : {this.renderTextWithLinks(comment.comment)}
                            </>
                          ) : (
                            <span>Unknown User: {this.renderTextWithLinks(comment.comment)}</span>
                          )}
                        </Typography>

                        {canDeleteComment && (
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            sx={{ mt: 1 }}
                            onClick={() => this.handleDeleteComment(photo._id, comment._id)}
                            disabled={this.state.deletingComment[comment._id]}
                          >
                            {this.state.deletingComment[comment._id] ? "Deleting..." : "DELETE"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle2">Add a Comment:</Typography>

                {this.state.commentError[photo._id] && (
                  <Alert severity="error" sx={{ mb: 1 }}>
                    {this.state.commentError[photo._id]}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={this.state.commentTexts[photo._id] || ''}
                  onChange={(e) => this.handleCommentChange(photo._id, e.target.value)}
                />

                <Button
                  variant="contained"
                  sx={{ mt: 1 }}
                  onClick={() => this.handleAddComment(photo._id)}
                  disabled={!this.state.commentTexts[photo._id]?.trim()}
                >
                  Post Comment
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
}

export default UserPhotos;