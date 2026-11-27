// Perf: intl-tel-input builds two ~240-country dropdowns, a ~300ms main-thread
// task on mobile. Run it only once the form is near the viewport (or its modal
// opens) instead of on page load. Falls back to immediate init without IO.
window.__claWhenVisible = window.__claWhenVisible || function (selector, init) {
  function start() {
    var el = document.querySelector(selector);
    if (!el) return;
    var done = false;
    function run() { if (done) return; done = true; init(); }
    var form = el.form || el;
    form.addEventListener("focusin", run, { once: true });
    form.addEventListener("pointerdown", run, { once: true });
    if (!("IntersectionObserver" in window)) return run();
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); run(); }
    }, { rootMargin: "300px 0px" });
    io.observe(el);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
};

window.__claWhenVisible("#popup_mob_phone", function () {
    // --- Mobile phone input ---
    var phoneInput = document.querySelector("#popup_mob_phone");
    var hiddenInput = document.querySelector("#popup_phone");
    var dialCodeInput = document.querySelector("#popup_dial_code");

    // Initialize phone input
    // NOTE: no `hiddenInput` option here — it defaults to naming its own
    // shadow field "phone" (not "popup_phone"), which the backend never
    // reads. #popup_phone/#popup_dial_code below are kept in sync manually
    // instead (see syncPhoneHiddenFields).
    var phoneIti = window.intlTelInput(phoneInput, {
        initialCountry: "IN",
        separateDialCode: true,
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js",
    });

    function syncPhoneHiddenFields() {
        hiddenInput.value = phoneIti.getNumber();
        dialCodeInput.value = phoneIti.getSelectedCountryData().dialCode || "";
    }

    $.validator.addMethod("validIntlPhone", function (value, element) {

        const iti = window.intlTelInputGlobals.getInstance(element);

        if (!value.trim()) return false;

        // Remove all formatting characters
        const cleaned = value.replace(/[^\d+]/g, "");

        return iti.isValidNumber();

    }, "Enter valid mobile number");

    phoneInput.addEventListener("paste", function () {

        setTimeout(function () {

            // Remove everything except digits
            let cleaned = phoneInput.value.replace(/\D/g, "");

            // Remove leading country code if duplicated
            const countryCode = phoneIti.getSelectedCountryData().dialCode;

            if (cleaned.startsWith(countryCode)) {
                cleaned = cleaned.slice(countryCode.length);
            }

            // Set cleaned value back to input
            phoneInput.value = cleaned;

            // Trigger intl-tel-input to reformat properly
            phoneIti.setNumber("+" + countryCode + cleaned);

            syncPhoneHiddenFields();

        }, 0);

    });


    // Disable country flag dropdown — lock it
    // phoneInput.parentNode.querySelector(".iti__flag-container").style.pointerEvents = "none";

    phoneInput.addEventListener('input', syncPhoneHiddenFields);
    phoneInput.addEventListener('blur', syncPhoneHiddenFields);
    phoneInput.addEventListener('countrychange', syncPhoneHiddenFields);


    // --- Country selector input ---
    var countryInput = document.querySelector("#popup_country_selector");

    var countryIti = window.intlTelInput(countryInput, {
        initialCountry: "IN",
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.1.1/build/js/utils.js",
        separateDialCode: false,
    });

    // Set initial country name
    countryInput.value = countryIti.getSelectedCountryData().name;

    // When country changes, sync phone input
    countryInput.addEventListener('countrychange', function () {
        var selectedCountry = countryIti.getSelectedCountryData();
        countryInput.value = selectedCountry.name;

        // Sync phone input country
        // phoneIti.setCountry(selectedCountry.iso2);
        // console.log("Phone input country locked to:", selectedCountry.iso2);
    });

    // Optional: prevent user typing country name directly (use dropdown only)
    countryInput.addEventListener("input", function () {
        this.value = countryIti.getSelectedCountryData().name;
    });


});


// $("#footercontact").validate({
//   rules: {
//     name: {
//       required: true,
//     },
//     email: {
//       required: true,
//     },
//     mob_phone: {
//       required: true,
//       digits: true
//     },
//     requirement: {
//       required: true,
//     },
//     skype: {
//       required: true,
//     },
//     country_selector: {
//       required: true,
//     },
//     message: {
//       required: true,
//     },
//   },
//   messages: {
//     name: {
//       required: "Enter Name",
//     },
//     email: {
//       required: "Enter email",
//     },
//     mob_phone: {
//       required: "Enter phone",
//       digits: "Allowed number only"
//     },
//     skype: {
//       required: "Enter skype",
//     },
//     requirement: {
//       required: "Enter requirement",
//     },
//     country_selector: {
//       required: "Enter Country",
//     },
//     message: {
//       required: "Enter message",
//     },
//   },
//   // errorPlacement: function (error, element) {
//   //   console.log({error})
//   //   console.log(element.attr("name"))
//   //   if (element.attr("name") === "requirement") {
//   //     error.insertAfter(".service-check"); // place error below checkboxes
//   //   } else {
//   //     error.insertAfter(element);
//   //   }
//   // },
//   submitHandler: function (form, e) {
//     console.log({ form }, { errir: e })
//     $("#contact_submit_btn").prop("disabled", true);
//     $("#contact_submit_btn-2").hide();
//     $(".spinner-border").show();
//     $.ajax({
//       type: 'POST',
//       url: window.location.origin + '/contact_submit',
//       data: $("#footercontact").serialize(),
//       dataType: "json",
//       success: function (result) {
//         console.log('result', result)
//         if (result.status == true) {
//           window.location.href = "/thankyou";
//         }
//       },
//       error: function (error) {
//       }
//     }).done((result) => {
//       if (!result.status) {
//         alert("ReCaptcha Error!")
//       };
//     });
//   },
// });





$(document).ready(function () {

    $("#popupcontact").validate({
        ignore: [], // ✅ ensures hidden fields & checkboxes are validated too
        rules: {
            popup_name: {
                required: true,
                normalizer: function (value) {
                    return $.trim(value); // removes leading & trailing spaces
                },
                pattern: /^[a-zA-Z\s]+$/ // only letters and spaces
            },
            popup_email: {
                required: true,
                email: true,
            },
            popup_mob_phone: {
                required: true,
                validIntlPhone: true
            },
            popup_country_selector: {
                required: true,
            },
            popup_requirement: {
                required: true,
            },
            popup_message: {
                required: true,
                normalizer: function (value) {
                    return $.trim(value);
                },
                pattern: /^[a-zA-Z0-9\s.,!?@#$%^&*()_+=:'"\/\\[\]|`~-]+$/
                // pattern: /^[a-zA-Z0-9\s.,!?-]+$/ // allow limited safe characters
            },
            // ✅ we’ll handle requirement manually below (for checkbox group)
        },
        messages: {
            popup_name: {
                required: "Enter your name",
            },
            popup_email: {
                required: "Enter your email",
                email: "Please enter a valid email address",
            },
            popup_mob_phone: {
                required: "Enter your mobile number",
                digits: "Only numbers are allowed",
                minlength: "Enter a valid mobile number",
            },
            popup_country_selector: {
                required: "Enter your country",
            },
            popup_requirement: {
                required: "Enter your Service Requirement",
            },
            popup_message: {
                required: "Enter your message",
            },
        },
        errorElement: "small",
        errorClass: "text-danger",

        errorPlacement: function (error, element) {
            error.insertAfter(element);
        },
        submitHandler: function (form) {
            // Without a ticked checkbox the server can only reply "reCaptcha Error".
            $("#popup-recaptcha-error").remove();
            if (typeof grecaptcha === "undefined" || !grecaptcha.getResponse(window.popupWidgetId)) {
                $("#popup-recaptcha-container").after('<small id="popup-recaptcha-error" class="text-danger d-block">Please verify that you are not a robot.</small>');
                return false;
            }

            $("#popup_contact_submit_btn").prop("disabled", true);
            $(".spinner-border").show();

            $.ajax({
                type: "POST",
                url: window.location.origin + "/popup_contact_submit",
                data: $("#popupcontact").serialize(),
                dataType: "json",
                success: function (result) {
                    if (result.status === true) {
                        window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: "generate_lead" });
                        window.location.href = "/thankyou";
                    } else {
                        alert("ReCaptcha Error!");
                        resetRecaptcha(window.popupWidgetId);
                    }
                },
                error: function (error) {
                    console.error(error);
                    resetRecaptcha(window.popupWidgetId);
                },
                complete: function () {
                    $("#popup_contact_submit_btn").prop("disabled", false);
                    $(".spinner-border").hide();
                }
            });
        }
    });

    $("#popup_requirement").on("change", function () {
        $(this).valid();
    });

});