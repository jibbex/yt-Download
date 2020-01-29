exports.selectOption = (elem, val) => {
  for(i = 0; i < elem.options.length; i++) {
    if(elem.options[i].value == val) {
      const selectEl = M.FormSelect.getInstance(elem);
      elem.selectedIndex = i;
      elem.options[i].selected = true;
      selectEl.input.value = elem.options[i].innerHTML;
      break;
    }
  }
}

exports.createEl = (el, isTextNode = false) => {
  try {
    if(isTextNode)
      return document.createTextNode(el);

    return document.createElement(el);
  }
  catch(err) {
    return document.createTextNode(el);
  }
}

exports.animateCSS = (element, animationName, callback)  => {
    const node = typeof(element) === 'object' ? element : document.querySelector(element)
    node.classList.add('animated', animationName)

    function handleAnimationEnd() {
        node.classList.remove('animated', animationName)
        node.removeEventListener('animationend', handleAnimationEnd)

        if (typeof callback === 'function') callback()
    }

    node.addEventListener('animationend', handleAnimationEnd)
}

exports.getElem = (query) => {
  return document.querySelector(query);
}

exports.getElems = (query) => {
  return document.querySelectorAll(query);
}
