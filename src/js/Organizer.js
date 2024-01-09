import {
  fromEvent, switchMap,
} from 'rxjs';
import {
  map, filter, debounceTime, tap,
} from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import Render from './Render';
import Utils from './components/rxjs/Utils';
import Navigator from './components/geolocation/Navigator';
import Media from './components/media/Media';
import 'highlight.js/styles/github.css';

export default class Organizer {
  constructor(container) {
    this.media = new Media();
    this.url = 'https://ahj-diploma-mcm1.onrender.com';
    this.fileReader = new FileReader();
    this.currentAttachments = new Map();
    this.container = container;
    this.render = new Render(container);
    this.mainer = this.container.querySelector('.main');
    this.main = this.container.querySelector('.main-messages');
    this.attachContainer = this.container.querySelector('.attachment-container');
    this.attachInput = this.container.querySelector('.attachment-input');
    this.messInput = this.container.querySelector('.mess-input');
    this.messForm = this.container.querySelector('.message-form');
    this.attachments = this.container.querySelector('.attachments');
    this.otherOpportunities = this.container.querySelector('.other');
    this.otherOpportunitiesList = this.container.querySelector('.other-list');
    this.otherOpportunitiesListElement = this.container.querySelectorAll('.other-list-element');
    this.mediaMainContainer = this.container.querySelector('.media-main-container');
    this.mediaRecord = this.container.querySelector('.media-record');
    this.mediaRecordStop = this.container.querySelector('.media-stop');
    this.sendButton = this.container.querySelector('.send-button');
    this.videoModal = this.container.querySelector('.video-modal');
    this.emojiContainer = this.container.querySelector('.emoji-container');
    this.emojiList = this.container.querySelector('.emoji-list');
    this.emoji = this.container.querySelectorAll('.emoji');

    this.lazyloadId = 0;
  }

  init() {
    this.wsInit();
    this.onSendMessage();
    this.onDragAndDrop();
    this.onAddAttachmets();
    this.lazyload();
    this.showOtherOpportunities();
    this.onEnter();
    this.onMediaRecordClick();
    this.onEmoji();
    this.messEditable();
  }

  wsInit() {
    this.ws$ = webSocket(`wss://${new URL(this.url).host}`);
    this.ws$.subscribe({
      // Called whenever there is a message from the server
      next: (msg) => {
        if (Array.isArray(msg)) {
          this.lazyloadId = msg[0].id;
          this.render.createMessages(msg);
        } else {
          this.render.createMessage(msg, true);
          this.mainer.scrollTop = this.mainer.scrollHeight;
        }
        if (this.main.clientHeight < this.mainer.clientHeight) {
          const req = {
            type: 'lazyload',
            lastId: this.lazyloadId,
          };
          this.ws$.next(req);
        }
      },
      error: (err) => console.log(err), // Called if at any point WS API signals some kind of err
      complete: () => console.log('complete'), // Called when connection is closed (for whatever reason)
    });
  }

  showOtherOpportunities() {
    const clickContainer$ = fromEvent(this.otherOpportunities, 'click');
    const clickListElement$ = fromEvent(this.otherOpportunitiesListElement, 'click');
    clickContainer$.pipe(
      map(() => {
        this.otherOpportunitiesList.classList.toggle('hide');
      }),
      switchMap(() => clickListElement$.pipe(
        map((e) => {
          const { type } = e.target.closest('.other-list-element').dataset;
          return type;
        }),
      )),
    ).subscribe((type) => {
      if (type === 'location') {
        Navigator.getNavigation().then(
          (resolve) => {
            const { latitude, longitude } = resolve;
            const res = `Широта: ${latitude} и долгота: ${longitude}`;
            const objMess = this.createObjForSend(res);
            this.ws$.next(objMess);
          },
        );
      }
    });
  }

  onAddAttachmets() {
    const clickContainer$ = fromEvent(this.attachContainer, 'click');
    clickContainer$.subscribe(() => this.attachInput.dispatchEvent(new MouseEvent('click')));

    const changeInput$ = fromEvent(this.attachInput, 'change');
    changeInput$.pipe(
      map((e) => {
        this.sendButton.classList.remove('hide');
        const file = e.target.files && e.target.files[0];
        if (!file) return false;
        this.fileReader.readAsDataURL(file);
        return file;
      }),
      switchMap((file) => this.readFile(file)),
    ).subscribe((obj) => {
      this.currentAttachments.set(obj.name, obj.src);
      this.render.createAttachments(this.currentAttachments);
    });
  }

  onSendMessage() {
    this.send$ = fromEvent(this.messForm, 'submit');
    this.send$.pipe(
      Utils.preventDefault(), // custom function
      map((event) => {
        const formData = new FormData(event.target);
        return formData.get('mess');
      }),
    ).subscribe((mess) => {
      const data = this.createObjForSend(mess);

      this.ws$.next(data);
      this.messForm.reset();

      this.currentAttachments.clear();
      this.render.createAttachments(this.currentAttachments);
    });
  }

  onDragAndDrop() {
    const dragover$ = fromEvent(this.container, 'dragover');
    const drop$ = fromEvent(this.container, 'drop');

    dragover$.pipe(
      Utils.preventDefault(),
      switchMap(() => drop$.pipe(
        Utils.preventDefault(),
        map((e) => {
          this.sendButton.classList.remove('hide');
          const file = e.dataTransfer.files && e.dataTransfer.files[0];
          if (!file) return false;
          this.fileReader.readAsDataURL(file);
          return file;
        }),
        switchMap((file) => this.readFile(file)),
      )),
    ).subscribe((obj) => {
      this.currentAttachments.set(obj.name, obj.src);
      this.render.createAttachments(this.currentAttachments);
    });
  }

  createObjForSend(message, formData) {
    if (formData) {
      return {
        message,
        formData,
      };
    }
    const attachments = [];
    this.currentAttachments.forEach((src) => {
      attachments.push(src);
    });
    return {
      message,
      attachments,
    };
  }

  readFile(file) {
    const readerFlow$ = fromEvent(this.fileReader, 'load');
    return readerFlow$.pipe(
      map((e) => {
        const src = e.target.result;
        return { name: file.name, src };
      }),
    );
  }

  lazyload() {
    const scroll$ = fromEvent(this.mainer, 'wheel');
    const pairs$ = scroll$.pipe(
      debounceTime(50),

      map(() => {
        const posTop = this.main.getBoundingClientRect().top;
        const posTop2 = this.mainer.getBoundingClientRect().top;
        console.log(posTop - posTop2);
        return posTop - posTop2 > -0.5;
      }),

      filter(Boolean),
    );

    pairs$.subscribe(() => {
      const req = {
        type: 'lazyload',
        lastId: this.lazyloadId,
      };
      if (this.lazyloadId <= 1) return;
      this.ws$.next(req);
    });
  }

  onEnter() {
    const send$ = fromEvent(this.messInput, 'keydown');
    const stream$ = fromEvent(this.messInput, 'input');

    stream$.pipe(
      tap(() => this.sendButton.classList.remove('hide')),
      filter((e) => e.target.value === ''),
      map(() => this.sendButton.classList.add('hide')),
    ).subscribe((e) => console.log(e));

    send$.pipe(
      filter((e) => e.code === 'Enter' && !e.shiftKey),
      Utils.preventDefault(),
      filter(() => this.messInput.value !== ''),
      tap(() => this.sendButton.classList.add('hide')),
    ).subscribe(() => this.messForm.dispatchEvent(new Event('submit')));
  }

  onMediaRecordClick() {
    const send$ = fromEvent(this.sendButton, 'click');
    const stream$ = fromEvent(this.mediaMainContainer, 'click');
    stream$.pipe(/* TODO Вот этот async не рушит всю суть RXJS?
    Если да, то как правильно оформить асинхронность,
    если функция toPromise больше не используется? */
      tap(async (e) => {
        const { type } = e.target.closest('.media-container').dataset;
        let req;

        if (type === 'video') {
          req = { audio: true, video: true };
        } else {
          req = { audio: true };
        }

        const ready = await this.media.init(req, type);
        if (!ready) {
          console.log('Необходимо дать разрешение на использование камеры или микрофона');
          return;
        }

        this.media.start();
        this.recOn = true;
        this.mediaRecord.classList.add('hide');
        this.mediaRecordStop.classList.remove('hide');
        this.sendButton.classList.remove('hide');
      }),
    ).subscribe();

    send$.pipe(
      tap((e) => {
        this.sendButton.classList.add('hide');
        console.log(e);
        if (this.recOn) {
          this.media.stop();
          this.recOn = false;
        }
      }),
      filter(() => this.media.modal.open),
      Utils.preventDefault(),
      debounceTime(2000), /* TODO как правильно оформить ожидание наличия файла в ридере?
      debounce же явно не очень надежный вариант */
      tap(() => {
        this.fileReader.readAsDataURL(this.media.blob);
      }),
      switchMap(() => this.readFile({ name: 'video' })),
    ).subscribe((obj) => {
      const data = {
        message: '',
        attachments: [obj.src],
      };
      this.ws$.next(data);
      this.container.querySelector('.media-stop').classList.add('hide');
      this.mediaRecord.classList.remove('hide');
      this.videoModal.open = false;
      this.currentAttachments.clear();
    });
  }

  onEmoji() {
    const streamContainer$ = fromEvent(this.emojiContainer, 'click');
    const stream$ = fromEvent(this.emoji, 'click');
    streamContainer$.pipe(
      tap(() => this.emojiList.classList.toggle('hide')),
      switchMap(() => stream$),
      map((e) => e.target.innerText),
    ).subscribe((emoji) => {
      this.messInput.value += emoji;
      this.sendButton.classList.remove('hide');
    });
  }

  messEditable() {
    const stream$ = fromEvent(this.messInput, 'keyup');

    stream$.pipe(
      filter((e) => e.target.scrollTop > 0),
    ).subscribe((e) => {
      e.target.style.height = `${e.target.scrollHeight}px`;
    });
  }
}
