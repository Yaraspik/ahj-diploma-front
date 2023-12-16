import { tap } from 'rxjs/operators';

export default class Utils {
  static preventDefault() {
    return tap((e) => {
      e.preventDefault();
    });
  }
}
