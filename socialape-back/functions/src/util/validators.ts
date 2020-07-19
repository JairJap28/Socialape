const isEmpty = (value: string) => {
    if (value.trim() === '') return true;
    return false;
}

const isEmail = (email: string) => {
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(regEx)) return true;
    return false;
}

export const validateSignUpData = (data: any) => {
    let errors: any = {};

    if (isEmpty(data.email)) errors.email = 'Must not be empty';
    else if (!isEmail(data.email)) errors.email = 'Must be a valid email address';

    if (isEmpty(data.password)) errors.password = 'Must not be empty';
    if (data.password !== data.confirmPassword) errors.confirmPassword = 'Passwords must match';
    if (isEmpty(data.handle)) errors.handle = 'Must not be empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

export const validateLoginData = (data: any) => {
    let errors: any = {};

    if (isEmpty(data.email)) errors.email = 'Must not be empty';
    else if (!isEmail(data.email)) errors.email = 'Must be a valid email address';
    if (isEmpty(data.password)) errors.password = 'Must not be empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false
    }
}

export const reduceUserDetails = (data: any) => {
    let userDetails: any = {};

    if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if (!isEmpty(data.website.trim())) {
        if (data.website.trim().substring(0, 4) !== 'http') {
            userDetails.website = `http://${data.website.trim()}`;
        } else {
            userDetails.website = data.website.trim();
        }
    }
    if (!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails;
}