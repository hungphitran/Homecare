const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

/**
 * Hàm tải template
 *
 * Cách dùng:
 * <div id="parent"></div>
 * <script>
 *  load("#parent", "./path-to-template.html");
 * </script>
 */
function load(selector, path) {
    const cached = localStorage.getItem(path);
    if (cached) {
        $(selector).innerHTML = cached;
    }

    fetch(path)
        .then((res) => res.text())
        .then((html) => {
            if (html !== cached) {
                $(selector).innerHTML = html;
                localStorage.setItem(path, html);
            }
        })
        .finally(() => {
            window.dispatchEvent(new Event("template-loaded"));
        });
}

/**
 * Hàm kiểm tra một phần tử
 * có bị ẩn bởi display: none không
 */
function isHidden(element) {
    if (!element) return true;

    if (window.getComputedStyle(element).display === "none") {
        return true;
    }

    let parent = element.parentElement;
    while (parent) {
        if (window.getComputedStyle(parent).display === "none") {
            return true;
        }
        parent = parent.parentElement;
    }

    return false;
}

/**
 * Hàm buộc một hành động phải đợi
 * sau một khoảng thời gian mới được thực thi
 */
function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}

/**
 * Hàm tính toán vị trí arrow cho dropdown
 *
 * Cách dùng:
 * 1. Thêm class "js-dropdown-list" vào thẻ ul cấp 1
 * 2. CSS "left" cho arrow qua biến "--arrow-left-pos"
 */
const calArrowPos = debounce(() => {
    if (isHidden($(".js-dropdown-list"))) return;

    const items = $$(".js-dropdown-list > li");

    items.forEach((item) => {
        const arrowPos = item.offsetLeft + item.offsetWidth / 2;
        item.style.setProperty("--arrow-left-pos", `${arrowPos}px`);
    });
});

// Tính toán lại vị trí arrow khi resize trình duyệt
window.addEventListener("resize", calArrowPos);

// Tính toán lại vị trí arrow sau khi tải template
window.addEventListener("template-loaded", calArrowPos);
/**
 * Giữ active menu khi hover
 *
 * Cách dùng:
 * 1. Thêm class "js-menu-list" vào thẻ ul menu chính
 * 2. Thêm class "js-dropdown" vào class "dropdown" hiện tại
 *  nếu muốn reset lại item active khi ẩn menu
 */
window.addEventListener("template-loaded", handleActiveMenu);

function handleActiveMenu() {
    const dropdowns = $$(".js-dropdown");
    const menus = $$(".js-menu-list");
    const activeClass = "menu-top__item--active";

    const removeActive = (menu) => {
        menu.querySelector(`.${activeClass}`)?.classList.remove(activeClass);
    };

    const init = () => {
        menus.forEach((menu) => {
            const items = menu.children;
            if (!items.length) return;

            removeActive(menu);
            if (window.innerWidth > 991)
            items[0].classList.add(activeClass);

            Array.from(items).forEach((item) => {
                item.onmouseenter = () => {
                    if (window.innerWidth <= 991) return;
                    removeActive(menu);
                    item.classList.add(activeClass);
                };
                item.onclick = () => {
                    if (window.innerWidth > 991) return;
                    removeActive(menu);
                    item.classList.add(activeClass);
                    item.scrollIntoView();
                };
            });
        });
    };

    init();

    dropdowns.forEach((dropdown) => {
        dropdown.onmouseleave = () => init();
    });
}
/**
 * JS toggle
 *
 * Cách dùng:
 * <button class="js-toggle" toggle-target="#box">Click</button>
 * <div id="box">Content show/hide</div>
 */
window.addEventListener("template-loaded", initJsToggle);

function initJsToggle() {
    $$(".js-toggle").forEach((button) => {
        const target = button.getAttribute("toggle-target");
        if (!target) {
            document.body.innerText = `Cần thêm toggle-target cho: ${button.outerHTML}`;
        }
        button.onclick = (e) => {
            e.preventDefault();
            if (!$(target)) {
                return (document.body.innerText = `Không tìm thấy phần tử "${target}"`);
            }
            const isHidden = $(target).classList.contains("hide");

            requestAnimationFrame(() => {
                $(target).classList.toggle("hide", !isHidden);
                $(target).classList.toggle("show", isHidden);
            });
        };
        document.onclick = function (e) {
    if (!e.target.closest(target)) {
        const isHidden = $(target).classList.contains("hide");
        if (!isHidden) {
            button.click();
        }
    }
};
    });
}
window.addEventListener("template-loaded", initJsToggle_2);

function initJsToggle_2() {
    $$(".js-toggle-2").forEach((button) => {
        const target = button.getAttribute("toggle-target-2");
        if (!target) {
            document.body.innerText = `Cần thêm toggle-target cho: ${button.outerHTML}`;
        }
        button.onclick = (e) => {
            e.preventDefault();
            if (!$(target)) {
                return (document.body.innerText = `Không tìm thấy phần tử "${target}"`);
            }
            const isHidden = $(target).classList.contains("hide-2");
            console.log(isHidden);
            if (isHidden) {
            document.getElementById("aside-longterm").classList.remove("show");
            document.getElementById("aside-longterm").classList.add("hide");
            }
            requestAnimationFrame(() => {
                $(target).classList.toggle("hide-2", !isHidden);
                $(target).classList.toggle("show-2", isHidden);
            });
        };
        document.onclick = function (e) {
    if (!e.target.closest(target)) {
        const isHidden = $(target).classList.contains("hide-2");
        if (!isHidden) {
            // document.getElementById("aside-longterm").classList.remove("show");
            // document.getElementById("aside-longterm").classList.add("hide");
            button.click();
        }
    }
};
    });
}
window.addEventListener("template-loaded", () => {
    const links = $$(".js-dropdown-list > li > a");

    links.forEach((link) => {
        link.onclick = () => {
            if (window.innerWidth > 991) return;
            const item = link.closest("li");
            item.classList.toggle("navbar__item--active");
        };
    });
});

window.addEventListener("template-loaded", activeForMenuTop);
function activeForMenuTop() {
    const menuTopDropDown = $(".menu-top__button-question.active");
    const menuTopDropDowns = $$(".menu-top__button-question");
    menuTopDropDowns.forEach(function(child, index){
        child.onclick = function () {
        
            $(".menu-top__button-question.active").classList.remove('active');
            this.classList.add('active');
    }
})
}

window.addEventListener("template-loaded", activeFaq);
function activeFaq(){
    const faqItems = $$(".faq__item");
    faqItems.forEach(function (child, index) {
        child.onclick = function () {
            if(child.classList.contains("active")){
                child.classList.remove("active");
            }else{
                child.classList.add("active");
                faqItems.forEach(function (other, index) {
                    if(other != child){
                        other.classList.remove("active");
                    }
                })
            }
        }
    })
}
// window.addEventListener("template-loaded", animation);
// function animation(){
//    // function to open/close nav
// function toggleNav(){
//   // if nav is open, close it
//   if (!isHidden($(".nav-test"))) {
//     $(".nav-test").style.display = "none"; // Hide the nav
//     $(".header-test__button").classList.remove("menu");
//   }
//   // if nav is closed, open it
//   else{
//     $(".header-test__button").classList.add("menu");
//     $(".nav-test").style.display = "flex";
//   }
// }

// // when clicking + or ☰ button
// $(".header-test__button").onclick = function () {
//     // console.log("Button clicked");
//     // when clicking ☰ button, open nav
//     if ($(".header-test").classList.contains("open")) {
//         console.log("Button clicked");
//         toggleNav();
//     }
//     // when clicking + button, open header
//     else {
//         $(".header-test").classList.add("open");
//         setTimeout(() => {
//             $(".header-test").classList.add("remove");
//         }, 1000);
//     }
// };

// // close nav
// $("#nav-close").onclick = function () {
//         toggleNav();
//     };

//     // scroll to sections
//     $$(".nav-test__list li").forEach(function (child, index) {
//         child.onclick = function () {
//             var sections = $$(".content__section");
//             console.log("haha", index);
//             //  $(".nav-test").style.display = "none"; // Hide the nav
//             // $(".header-test__button").classList.remove("menu");
//             console.log("sections", sections);
//             if (index < sections.length) {
//                 var target = sections[index];
                
//                toggleNav();
//                 setTimeout(() => {
//                     console.log("target", target);
//                     target.scrollIntoView({ behavior: 'smooth' });
//                 }, 300);
//             }
//         }
//     });

//     // ... rest of the function ...
// }
window.addEventListener("template-loaded", resetPassword);
function resetPassword(){
     const inputs = $$(".otp-input"),
  button = $(".submit-btn");

// iterate over all inputs
inputs.forEach((input, index1) => {
  input.addEventListener("keyup", (e) => {
    // This code gets the current input element and stores it in the currentInput variable
    // This code gets the next sibling element of the current input element and stores it in the nextInput variable
    // This code gets the previous sibling element of the current input element and stores it in the prevInput variable
    const currentInput = input,
      nextInput = input.nextElementSibling,
      prevInput = input.previousElementSibling;

    // if the value has more than one character then clear it
    if (currentInput.value.length > 1) {
      currentInput.value = "";
      return;
    }
    // if the next input is disabled and the current value is not empty
    //  enable the next input and focus on it
    if (nextInput && nextInput.hasAttribute("disabled") && currentInput.value !== "") {
      nextInput.removeAttribute("disabled");
      nextInput.focus();
    }

    // if the backspace key is pressed
    if (e.key === "Backspace") {
      // iterate over all inputs again
      inputs.forEach((input, index2) => {
        // if the index1 of the current input is less than or equal to the index2 of the input in the outer loop
        // and the previous element exists, set the disabled attribute on the input and focus on the previous element
        if (index1 <= index2 && prevInput) {
          input.setAttribute("disabled", true);
          input.value = "";
          prevInput.focus();
        }
      });
    }
    //if the fourth input( which index number is 3) is not empty and has not disable attribute then
    //add active class if not then remove the active class.
    if (!inputs[5].disabled && inputs[5].value !== "") {
      button.classList.add("active");
      return;
    }
    button.classList.remove("active");
  });
});

//focus the first input which index is 0 on window load
//window.addEventListener("load", () => inputs[0].focus());
}
window.addEventListener("template-loaded", tabUi);
function tabUi(){
    // selector sử dụng chung
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
// những selector được chọn

const tabLine = $(".tab-item.active");
const tabs = $$(".tab-item");
const panes = $$(".tab-pane");
const line = $(".tabs .line");

// Only proceed if all required elements exist
if (!tabLine || !tabs || !panes || !line) {
    console.log("Tab elements not found, skipping tabUi initialization");
    return;
}

line.style.left = tabLine.offsetLeft +'px';
line.style.width = tabLine.offsetWidth + 'px';
tabs.forEach(function (tab, index) {
    var pane = panes[index];
    if (pane) {
        tab.onclick = function () {
            line.style.left = this.offsetLeft +'px';
            line.style.width = this.offsetWidth + 'px';
            const activePane = $(".tab-pane.active");
            const activeTab = $(".tab-item.active");
            if (activePane) activePane.classList.remove('active');
            if (activeTab) activeTab.classList.remove('active');
            pane.classList.add("active");
            this.classList.add("active");
        }
    }
})
}
window.addEventListener("template-loaded", () => {
    const introduce = document.getElementById("introduce");
    // Thêm sự kiện click
    introduce.onclick = function () {
        introduce.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest'});
    }
});
