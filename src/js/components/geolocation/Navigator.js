export default class Navigator {
  static getNavigation() {
    if (!navigator.geolocation) {
      throw new Error('Your browser can`t check location');
    }

    return new Promise((res, rej) => {
      navigator.geolocation.getCurrentPosition(
        (data) => {
          res(data.coords);
        },
        (err) => {
          rej(err);
        },
        { enableHighAccuracy: true },
      );
    });
  }

  getUserCoords(e, res) {
    e.preventDefault();

    const formData = new FormData(e.target);
    this.latitude = formData.get('latitude');
    this.longitude = formData.get('longitude');

    this.popupForm.removeEventListener('submit', this.getUserCoords);
    res();
  }

  async responseUserCoords() {
    return new Promise((res) => {
      this.popupForm.addEventListener('submit', (e) => this.getUserCoords(e, res));
    });
  }
}
