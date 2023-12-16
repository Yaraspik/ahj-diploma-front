import TextChecker from './components/textChecker/TextChecker';

export default class Render {
  constructor(container) {
    this.container = container;
    this.main = this.container.querySelector('.main-messages');
    this.attachments = this.container.querySelector('.attachments');
    this.messContainer = this.container.querySelector('.main-messages');
  }

  static createDate(timestamp) {
    const date = new Date(timestamp);

    let dateHours = date.getHours();
    let dateMinutes = date.getMinutes();
    let dateDay = date.getDate();
    let dateMonth = date.getMonth() + 1;

    dateHours = (dateHours < 10) ? `0${dateHours}` : dateHours;
    dateMinutes = (dateMinutes < 10) ? `0${dateMinutes}` : dateMinutes;
    dateDay = (dateDay < 10) ? `0${dateDay}` : dateDay;
    dateMonth = (dateMonth < 10) ? `0${dateMonth}` : dateMonth;

    return `${dateHours}:${dateMinutes} ${dateDay}.${dateMonth}.${date.getFullYear()}`;
  }

  createMessage(objMsg, last) {
    console.log(objMsg);
    const mess = Render.createElement('div', 'message', { id: objMsg.id });

    if (objMsg.message) {
      const text = objMsg.message;
      const textContainer = Render.createElement('div', 'message-text-container');
      const textWithLinks = TextChecker.addLinks(text);
      const htmlMessage = TextChecker.addCode(textWithLinks);
      textContainer.innerHTML = htmlMessage;
      mess.append(textContainer);
    }

    if (objMsg.attachments) {
      objMsg.attachments.forEach(async (el) => {
        const element = await Render.createMediaElement(el);
        mess.append(element);
      });
    }

    if (last) {
      this.main.prepend(mess);
    } else {
      this.main.append(mess);
    }
  }

  createMessages(objMsg) {
    objMsg.reverse().forEach((message) => {
      this.createMessage(message);
    });
  }

  createAttachments(attachs) {
    if (this.attachments.children[0]) {
      Array.from(this.attachments.children).forEach((el) => el.remove());
    }
    attachs.forEach((at) => {
      const attach = Render.createElement('div', 'attachments-element');
      const preview = Render.createElement('img', 'attachments-element-preview');
      const attachName = Render.createElement('img', 'attachments-element-name');
      attachName.textContent = at.name;
      preview.src = at;
      attach.append(preview, attachName);

      this.attachments.append(attach);
    });
  }

  static createElement(tag, classes, attrs = {}, text = '') {
    const element = document.createElement(tag);
    if (Array.isArray(classes)) {
      element.classList.add(...classes);
    } else {
      element.classList.add(classes);
    }

    if (attrs) {
      for (const name in attrs) {
        if (Object.hasOwnProperty.call(attrs, name)) {
          const value = attrs[name];
          element.setAttribute(name, value);
        }
      }
    }

    if (text) {
      element.innerText = text;
    }

    return element;
  }

  static async createMediaElement(attach) {
    const type = attach.substring(5, attach.indexOf(';'));

    if (type.includes('application')) {
      const file = await fetch(attach);
      const blob = await file.blob();
      const url = URL.createObjectURL(blob);
      const res = Render.createElement('div', 'message-file-img');
      const download = Render.createElement(
        'a',
        'message-file-pdf-download',
        {
          rel: 'noopener',
          download: 'filename',
          href: url,
        },
      );

      download.append(res);
      return download;
    }

    if (type.includes('blob')) {
      const res = Render.createElement('video', 'message-img', { controls: true });
      res.src = attach;
      return res;
    }

    if (type.includes('image')) {
      const res = Render.createElement('img', 'message-img');
      res.src = attach;
      return res;
    }

    if (type.includes('video')) {
      const res = Render.createElement('video', 'message-video', { controls: '' });
      res.src = attach;
      return res;
    }

    if (type.includes('audio')) {
      const res = Render.createElement('audio', 'message-video', { controls: '' });
      res.src = attach;
      return res;
    }

    return false;
  }
}
