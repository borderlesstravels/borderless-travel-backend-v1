const { check, validationResult } = require('express-validator');

//
// Website
//
exports.validateFlightOfferSearch = [
  check('origin').trim().not().isEmpty().withMessage('Where are you flying from?'),
  check('destination').trim().not().isEmpty().withMessage('Where are you flying to?'),
  check('departure_date').trim().not().isEmpty().withMessage('Provide the travel date'),
  check('adults').trim().not().isEmpty().withMessage('How many adults are flying?'),
  check('children').trim().not().isEmpty().withMessage('How many children are flying?'),
  check('infants').trim().not().isEmpty().withMessage('How many infants are flying?'),
  check('cabin').trim().not().isEmpty().withMessage('Select flight class. E.g: economy'),
];
exports.validatePaymentRecord = [
  check('service_name').trim().not().isEmpty().withMessage('What service are you paying for?'),
  check('booking_reference')
    .trim()
    .not()
    .isEmpty()
    .withMessage("Kindly supply the flight reference number. Usually starts with TW-'?"),
  check('transaction_reference')
    .trim()
    .not()
    .isEmpty()
    .withMessage("Payment gateway's transaction id is missing?"),
  check('amount').trim().not().isEmpty().withMessage('How much was paid?'),
  check('time').trim().not().isEmpty().withMessage('Transaction time is missing'),
];

exports.validateContactUsParams = [
  check('name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Name is missing!')
    .isLength({ min: 3, max: 30 })
    .withMessage('Valid name can only be between 3 and 30 characters long'),
  check('email').isEmail().withMessage('Email is invalid'),
  check('subject')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Subject is missing. Why are you messaging us?'),
  check('company')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Company/Brand is missing. Tell us your Brand or Company name'),
  check('message').trim().not().isEmpty().withMessage('Message content is missing.'),
];

exports.validateSubscriptionParams = [
  check('name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Name is missing!')
    .isLength({ min: 3, max: 30 })
    .withMessage('Valid name can only be between 3 and 30 characters long'),
  check('email')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Your email address is missing!')
    .isEmail()
    .withMessage('Invalid email address provided'),
  check('phone').trim().not().isEmpty().withMessage('Phone number is missing.'),
  check('country').trim().not().isEmpty().withMessage('Where are you from?'),
];

// Flight
exports.validateFlightBooking = [
  check('contact_details.c_first_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Contact First Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('First Name must be between 3 and 20 characters'),
  check('contact_details.c_last_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Contact Last Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Last Name must be between 3 and 20 characters'),
  check('contact_details.c_email').isEmail().withMessage('Contact Email is invalid'),
  check('contact_details.c_phone_number')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Contact Phone Number is missing!'),
  check('contact_details.c_relationship_to_p')
    .trim()
    .not()
    .isEmpty()
    .withMessage("Contact's relationship to passenger not specified"),
  check('passenger_details[0].passenger_type')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Passenger type is not specified!'),
  check('passenger_details[0].first_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Passenger First Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('First Name must be between 3 and 20 characters'),
  check('passenger_details[0].last_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Passenger Last Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Last Name must be between 3 and 20 characters'),
  check('passenger_details[0].dob')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Passenger Date of Birth is missing!'),
  check('passenger_details[0].gender')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Passenger Gender is missing!'),
  check('passenger_details[0].title')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Passenger Title is missing!'),
  check('passenger_details[0].email').isEmail().withMessage('Passenger Email is invalid'),
  check('passenger_details[0].phone_number')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Passenger Phone Number is missing!'),
];

// User
exports.validateUserSignupParams = [
  check('first_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('First Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('First Name must be between 3 and 25 characters'),
  check('last_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Last Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Last Name must be between 3 and 25 characters'),
  check('email').isEmail().withMessage('Email is invalid'),
  check('phone').isMobilePhone().withMessage('Phone numbr is invalid'),
  check('password').trim().not().isEmpty().withMessage('Password cannot be empty'),
];
exports.validateUpdateProfileUserParams = [
  check('first_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('First Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('First Name must be between 3 and 20 characters'),
  check('last_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Last Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Last Name must be between 3 and 20 characters'),
  check('username').trim().not().isEmpty().withMessage('Username is missing!'),
  check('phone').trim().not().isEmpty().withMessage('Phone Number is missing!'),
];
exports.validateUpdateEmailAlertUserParams = [
  check('priceAlert').trim().not().isEmpty().withMessage('Price Alert value is missing!'),
  check('travelAlert').trim().not().isEmpty().withMessage('Travel Alert value is missing!'),
];

// Admin Dashboard
exports.validateAdmin = [
  check('first_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('First Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('First Name must be between 3 and 20 characters'),
  check('last_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Last Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Last Name must be between 3 and 20 characters'),
  check('email').isEmail().withMessage('Email is invalid'),
  check('phone').trim().not().isEmpty().withMessage('Phone Number is missing!'),
  check('role').trim().not().isEmpty().withMessage('Admin Role is missing!'),
  check('username').trim().not().isEmpty().withMessage('Admin Username is missing!'),
];

exports.validateAddJob = [
  check('title').trim().not().isEmpty().withMessage('Job title is missing!'),
  check('location').trim().not().isEmpty().withMessage('Job location is missing!'),
  check('type').trim().not().isEmpty().withMessage('Employment type is missing!'),
  check('title').trim().not().isEmpty().withMessage('Job title is missing!'),
  check('description').trim().not().isEmpty().withMessage('Job description is missing!'),
  check('requirements').trim().not().isEmpty().withMessage('Job requirements is missing!'),
  check('salary').trim().not().isEmpty().withMessage('Job base salary is missing!'),
];

exports.validateAddPost = [
  check('title').trim().not().isEmpty().withMessage('Post title is missing!'),
  check('content').trim().not().isEmpty().withMessage('Post content is missing!'),
  check('author').trim().not().isEmpty().withMessage('Post author is missing!'),
  check('category').trim().not().isEmpty().withMessage('Post category is missing!'),
  check('post_status').trim().not().isEmpty().withMessage('Post status is missing!'),
];

exports.validateAddMarkup = [
  check('service_name').trim().not().isEmpty().withMessage('Service Name is missing!'),
  check('api_provider')
    .trim()
    .not()
    .isEmpty()
    .withMessage("API Provider is missing! For Inhouse Service, enter 'Borderles' as the provider"),
  check('api_key')
    .trim()
    .not()
    .isEmpty()
    .withMessage("API Key is missing! For Inhouse Service, enter 'Borderles' as the provider"),
  check('commission').trim().not().isEmpty().withMessage('Commion percent is missing!'),
  check('service_region').trim().not().isEmpty().withMessage('Provide the Service Region!'),
];

// Host dashboard
exports.validateAddPropertyParams = [
  check('hotel_name').trim().not().isEmpty().withMessage('Kindly provide your hotel name!'),
  check('country').trim().not().isEmpty().withMessage('Where is your hotel located?'),
  check('state').trim().not().isEmpty().withMessage('Which state is your hotel located?'),
  check('city').trim().not().isEmpty().withMessage('In which city is your hotel located?'),
  check('lga')
    .trim()
    .not()
    .isEmpty()
    .withMessage('In which local government area is your hotel located?'),
  check('postal_code')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Kindly provide the location postal code?'),
  check('hotel_address')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Kindly provide the full address of the hotel'),
  check('hotel_email').isEmail().withMessage('Hotel Email is invalid'),
  check('hotel_phone').trim().not().isEmpty().withMessage('Hotel Phone Number is missing!'),
  check('contact_first_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('First Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('First Name must be between 3 and 20 characters'),
  check('contact_last_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Last Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Last Name must be between 3 and 20 characters'),
  check('contact_email').isEmail().withMessage('Contact Email is invalid'),
  check('contact_phone').trim().not().isEmpty().withMessage('Contact Phone Number is missing!'),
  check('password').trim().not().isEmpty().withMessage('Password cannot be empty'),
];
exports.validateHostUpdateProfileParams = [
  check('first_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('First Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('First Name must be between 3 and 20 characters'),
  check('last_name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Last Name is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Last Name must be between 3 and 20 characters'),
  check('phone').trim().not().isEmpty().withMessage('Contact Phone Number is missing!'),
];
exports.validateUpdatePasswordParams = [
  check('oldPassword').trim().not().isEmpty().withMessage('Old Password is missing!'),
  check('newPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('New Password is missing!')
    .isLength({ min: 3, max: 20 })
    .withMessage('Password must be between 8 and 20 characters long'),
];

exports.validate = (req, res, next) => {
  const error = validationResult(req).array();
  if (!error.length) return next();
  res.status(400).json({ success: false, error: error[0].msg });
};
