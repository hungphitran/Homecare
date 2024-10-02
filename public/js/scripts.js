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
// window.addEventListener("template-loaded", activeButtonLongShort);
// function activeButtonLongShort(){
//     const activeForm = $(".btn__form-term.active-term");
//     const btnFormTerms = $$(".btn__form-term");
//     btnFormTerms.forEach(function (child, index) {
//         child.onclick = function () {
//             console.log(child);
//             $(".btn__form-term.active-term").classList.remove('active-term');
//             this.classList.add('active-term')
//         }
//     })
// }
window.addEventListener("template-loaded", widgetSelect);
function widgetSelect() {
    var x, i, j, l, ll, selElmnt, a, b, c;
    /*look for any elements with the class "custom-select":*/
    x = document.getElementsByClassName("custom-select");
    console.log("x", x);
    l = x.length;
    console.log("l", l);

    for (i = 0; i < l; i++) {
        console.log("i", i);
        selElmnt = x[i].getElementsByTagName("select")[0];
        console.log("selElmnt", selElmnt);
        ll = selElmnt.length;
        console.log("ll", ll);
        /*for each element, create a new DIV that will act as the selected item:*/
        a = document.createElement("DIV");
        //   console.log("a",a);
        a.setAttribute("class", "select-selected");
        console.log("selElmnt.options[selElmnt.selectedIndex]", selElmnt.options[selElmnt.selectedIndex]);
        a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
        console.log("a.innerHTML", a.innerHTML);
        x[i].appendChild(a);
        console.log("x[i]", x[i]);
        /*for each element, create a new DIV that will contain the option list:*/
        b = document.createElement("DIV");
        console.log("b", b);
        b.setAttribute("class", "select-items select-hide");
    
        for (j = 1; j < ll; j++) {
            /*for each option in the original select element,
            create a new DIV that will act as an option item:*/
            console.log("selElmnt.options[j]", selElmnt.options[j]);
            c = document.createElement("DIV");
            c.innerHTML = selElmnt.options[j].innerHTML;
    
            c.addEventListener("click", function (e) {
                e.stopPropagation();
                /*when an item is clicked, update the original select box,
                and the selected item:*/
                var y, i, k, s, h, sl, yl;
                s = this.parentNode.parentNode.getElementsByTagName("select")[0];
                console.log("s", s);
                // console.log(this.parentNode);
                // console.log(this.parentNode.parentNode);
                sl = s.length;
                console.log("sl", sl);
                // console.log(this.parentNode.previousSibling);
                h = this.parentNode.previousSibling;
                console.log("h", h);
                for (i = 0; i < sl; i++) {
                    if (s.options[i].innerHTML == this.innerHTML) {
                        s.selectedIndex = i;
                        h.innerHTML = this.innerHTML;
                        y = this.parentNode.getElementsByClassName("same-as-selected");
                        yl = y.length;
            
                        for (k = 0; k < yl; k++) {
                            y[k].removeAttribute("class");
                        }
                        this.setAttribute("class", "same-as-selected");
           
                        break;
                    }
                }
       
                h.click();
                setTimeout(() => {
                    s.dispatchEvent(new Event('change', { bubbles: true }));
                }, 0);

                // Close the dropdown
                closeAllSelect(this.parentNode.previousSibling);
            });
            b.appendChild(c);
  
        }
        x[i].appendChild(b);

        //console.log(a);
        a.addEventListener("click", function (e) {
            /*when the select box is clicked, close any other select boxes,
            and open/close the current select box:*/
            // console.log(this);
     
            e.stopPropagation();
            console.log(e.target);
            //   setTimeout(() => {
            //     selElmnt.dispatchEvent(new Event('change', { bubbles: true }));
            // }, 0);
            closeAllSelect(this);
            console.log("this.nextsibling before", this.nextSibling);
            this.nextSibling.classList.toggle("select-hide");
            console.log("this.nextSibling after", this.nextSibling);
            // console.log("this.classList before", this.classList);
            this.classList.toggle("select-arrow-active");
            // console.log("this.classList after", this.classList);
            //   selElmnt.click();
          
   
        });
    }
    function closeAllSelect(elmnt) {
        /*a function that will close all select boxes in the document,
        except the current select box:*/
        console.log("elmnt", elmnt);
        var x, y, i, xl, yl, arrNo = [];
        x = document.getElementsByClassName("select-items");
        console.log("x", x);
        y = document.getElementsByClassName("select-selected");
        console.log("y", y);
        xl = x.length;
        console.log("xl", xl);
        yl = y.length;
        console.log("yl", yl);
        for (i = 0; i < yl; i++) {
            if (elmnt == y[i]) {
                arrNo.push(i)
                console.log("arrNo", arrNo);
            } else {
                y[i].classList.remove("select-arrow-active");
                console.log("y[i]", y[i]);
            }
        }
        console.log("arrNo.indexOf(i)", arrNo.indexOf(i));
        for (i = 0; i < xl; i++) {
            if (arrNo.indexOf(i)) {
                x[i].classList.add("select-hide");
            }
        }
    }
    /*if the user clicks anywhere outside the select box,
    then close all select boxes:*/
    // document.addEventListener("click", closeAllSelect);
    // }
    document.addEventListener("click", function (e) {
        if (!e.target.closest('.custom-select')) {
            closeAllSelect();
        }
    });
}
// window.addEventListener("template-loaded", transformForm);
// function transformForm (){
    
// }
