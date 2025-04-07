function validator(options) {
    var formElement = document.querySelector(options.form);
    var selectorForms = {};
    // những hàm
    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }
    function validate(inputElement, rule) {
        var errorElement = getParent(inputElement, options.formGroupElement).querySelector(options.errorElement);
        var errorMessage;
        var rules = selectorForms[rule.selector];
        for (var i = 0; i < rules.length; i++){
            switch (inputElement.type) {
                case 'radio':
                case 'checkbox':
                    errorMessage = rules[i](formElement(rule.selector + ':checked'))
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }

            if (errorMessage) {
                break;
            }
        }
        if (errorMessage) {
            errorElement.innerText = errorMessage;
            getParent(inputElement, options.formGroupElement).classList.add("invalid");
        } else {
            errorElement.innerText = "";
            getParent(inputElement, options.formGroupElement).classList.remove("invalid");
        }
        return !errorMessage;
    }
    
    formElement.onsubmit = function (e) {
        // e.preventDefault();
        var isvalid = true;
        options.rules.forEach(function (rule) {
            var inputElement = formElement.querySelector(rule.selector);
             check = validate(inputElement, rule);
            if (!check) {
                isvalid = false;
            }
        });
        if (isvalid) {
            if (typeof options.onsubmit === "function") {
                enableInputs = formElement.querySelectorAll("[name]");
                var result=Array.from(enableInputs).reduce(function (values, input) {
                    switch (input.type) {
                        case 'radio':
                            values[input.name] = formElement.querySelector('input[name"' + input.name + "']:checked").value;
                            break;
                        case 'checkbox':
                            if (!input.matches(":checked")) {
                                values[input.name] = "";
                                return values
                            }
                            if (!Array.isArray(values[input.name])) {
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                            break;
                    }
                    return values;
                }, {})
                options.onsubmit(result);

            } else {
                formElement.submit();
            }
        }
    }
    options.rules.forEach(function (rule) {
        if (Array.isArray(selectorForms[rule.selector])) {
            selectorForms[rule.selector].push(rule.test);
        } else {
            selectorForms[rule.selector] = [rule.test];
        }
        var inputElements = formElement.querySelectorAll(rule.selector);
        
        Array.from(inputElements).forEach(function (inputElement) {

            inputElement.onblur = function () {
                
                validate(inputElement, rule);
            }
            inputElement.oninput = function () {
                var errorElement = getParent(inputElement, options.formGroupElement).querySelector(options.errorElement);
                errorElement.innerText=""
                getParent(inputElement, options.formGroupElement).classList.remove("invalid");
            }
        })
    })
        
    }
// định nghĩa các rule
// fullname
validator.isRequire = function (selector, meg) {
    
   return {
        selector: selector,
        test: function (value) {
            return value ? undefined : meg || "tên của bạn không được tìm thấy";
        }
    }
}
// phone
validator.isPhone = function (selector, meg) {
    return {
        selector: selector,
        test: function (value) {
            var regrex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/;
            return regrex.test(value) ? undefined : meg || "please enter at least about 10 number";
        }
    }
}
// email
validator.isEmail=function (selector, meg){
    return {
        selector: selector,
        test: function (value) {
            var regrex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
            return regrex.test(value) ? undefined : meg || "bạn hãy nhập đúng định dạng email!";
        }
    }
}
// password
validator.isMInPassword = function (selector, min, meg) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : meg || "the password enter at least 6 characters";
        }
    }
}
// phone
validator.isMinNumber = function (selector, min, meg) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : meg || "please enter at least about 10 number";
        }
    }
}
// confirmation 
validator.isConfirmationPassword=function (selector, getPassword, meg){
    return {
        selector: selector,
        test: function (value) {
            return value === getPassword() ? undefined : meg || "Your password is incorrect!";
        }
    }
}