const validMobileNumber = (value) => {
  let validNumber = value.match(
    "^(?:\\+88|88)?(01[3-9]\\d{8})$"
  ); /*Regular expression to validate number*/
  /*When valid return without +88/88 number if exist*/
  if (validNumber) {
    return validNumber[1]; /*valid number method return 3 with actual input*/
  } else {
    return false; /*return false when not valid*/
  }
};

module.exports = validMobileNumber;
