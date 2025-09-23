function passwordValidator (senha: string): boolean {

    let passwordLengthMatch: boolean = false;
          let value: number = 0;

          let upperCaseRegex = /[A-Z]/.test(senha);
          let numberRegex = /[0-9]/.test(senha);
          let lowerCaseRegex = /[a-z]/.test(senha);
          let specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/.test(senha);

          if (upperCaseRegex) value += 20;
          if (lowerCaseRegex) value += 20;
          if (numberRegex) value += 20;
          if (specialCharacterRegex) value += 20;
          if (senha.length >= 8) value += 20;

          if (senha.length >= 8) {
            passwordLengthMatch = true;
          }

          if(!passwordLengthMatch) {
            return false
          }

          if(value < 60) {
            return false
          }

          return true
}

export default passwordValidator;