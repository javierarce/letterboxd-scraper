class App {
  constructor () {

  }

  onload () {
    console.log('Hello!')
  }
}

window.onload = new App().onload
