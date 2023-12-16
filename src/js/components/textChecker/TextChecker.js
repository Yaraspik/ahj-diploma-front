import hljs from 'highlight.js';

export default class TextChecker {
  static addLinks(text) {
    // eslint-disable-next-line
    const urlRegex = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    if (text.match(urlRegex) === null) return text;
    const res = text.replace(
      urlRegex,
      (url) => `<a href="${url}" target="_blank">${url}</a>`,
    );
    return res;
  }

  static addCode(text) {
    // eslint-disable-next-line
    const codeRegex = /(\`{3}(\n?(.*)\n?[^`]+)\`{3})/gi;
    if (text.match(codeRegex) === null) return text;
    const res = text.replace(
      codeRegex,
      (code) => `${code.replace(/```/gi, '')}`,
    );
    const a = hljs.highlightAuto(res);
    console.log(a);
    return a.value;
  }
}
