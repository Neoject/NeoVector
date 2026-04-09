export function setPageTitle(title, text) {
    let add = '';
    if (text) add = ' - ' + text;
    document.title = title ? `${title}${add}` : '';
}