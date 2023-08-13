class Base {
  constructor () {
    this.className = this.constructor.name
    this.templateData = {}
  }

  killEvent (event) {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  isEmpty (obj) {
    return Object.keys(obj).length === 0;
  }

  createElement ({ className, html, text, elementType = 'div', type,  ...options }) {
    let $el = document.createElement(elementType)

    if (type) {
      $el.type = 'text'
    }

    if (html) {
      $el.innerHTML = html
    } else if (text) {
      $el.innerText = text
    }

    className.split(' ').filter(c => c).forEach(name => $el.classList.add(name))

    if (!this.isEmpty(options)) {
      Object.keys(options).forEach((key) => {
        $el[key] = options[key]
      })
    }

    return $el
  }

 transitionWithDelay(el, action, className, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        if (action === "add") {
          el.classList.add(className);
        } else if (action === "remove") {
          el.classList.remove(className);
        }
        resolve();
      }, delay);
    });
  }

  /*transitionWithDelay(el, action, className, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        el.classList[action](className)
        resolve();
      }, delay)
    })
  }
*/
  template () {
    return `<div class="Template"></div>`
  }

  renderTemplate () {
    let className = this.className
    this.$el = this.createElement({ className })
    const html = ejs.render(this.template(), this.templateData)
    this.$el.insertAdjacentHTML('beforeend', html)
  }

  on (name, callback) {
    const $el = this.$el || document.body

    $el.addEventListener(name, (e) => {
      callback && callback(e.detail)
    })
  }

  emit (name, data) {
    if (!name) {
      console.error('Error: empty name event')
      return
    }

    let event = undefined

    if (data !== undefined) {
      event = new CustomEvent(name, { detail: data })
    } else {
      event = new Event(name)
    }

    const $el = this.$el || document.body
    $el.dispatchEvent(event)
  }

  render () {
    this.renderTemplate()
    return this.$el
  }
}
