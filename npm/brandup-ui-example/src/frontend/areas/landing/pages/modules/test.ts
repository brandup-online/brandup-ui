import "./test.less";

export const Test = (elem: HTMLElement) => {
    elem.innerText = "test ok";
    elem.classList.add("async");
};