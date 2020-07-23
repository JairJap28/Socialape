import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

// MUI stuff
import { withStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

const style = (theme) => ({
    ...theme.spreadThis,
    containerComment: {
        width: 'calc(100% - 60px)',
        marginLeft: 30,
        marginRight: 30
    },
    commentImage: {
        maxWidth: '100%',
        height: 90,
        objectFit: 'cover',
        borderRadius: '50%'
    },
    commentData: {
        marginLeft: 20
    }
});

class Comments extends Component {
    render() {
        const { comments, classes } = this.props;
        return (
            <Grid container>
                {comments.map((comment, index) => {
                    const { body, createAt, userImage, userHandle } = comment;
                    return (
                        <Fragment key={createAt}>
                            <Grid item sm={12}>
                                <Grid container className={classes.containerComment}>
                                    <Grid item sm={2}>
                                        <img src={userImage} alt="comment" className={classes.commentImage}/>
                                    </Grid>
                                    <Grid item sm={9}>
                                        <div className={classes.commentData}>
                                            <Typography
                                                variant="h5"
                                                component={Link}
                                                to={`/users/${userHandle}`}
                                                color="primary">
                                                {userHandle}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="textSecondary">
                                                {dayjs(createAt).format('h:mm a, MMMM DD YYYY')}
                                            </Typography>
                                            <hr className={classes.invisibleSeparator} />
                                            <Typography variant="body1">{body}</Typography>
                                        </div>
                                    </Grid>
                                </Grid>
                            </Grid>
                            {index !== comments.length - 1 ? (
                                <hr className={classes.visibleSeparator} /> 
                            ) : (
                                <hr className={classes.invisibleSeparator} />
                            )}
                        </Fragment>
                    )
                })}
            </Grid>
        );
    }
}

Comments.propTypes = {
    comments: PropTypes.array.isRequired
}

export default withStyles(style)(Comments);