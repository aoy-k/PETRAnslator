'use strict';

const DefaultReg = "([、。！!？\\?「」\\[\\]【】（）\\(\\)ww/\\n　 𛀂0-9])"
function $(id) { return document.getElementById(id) }

/**
 * 基数変換　n進数→10進数
 * @param {Integer} x 
 * @param {Integer} base 
 * @returns Integer 変換された数
 */
 function to10Scale(x, base) {
  const parsed = parseInt(x, base);
  if (isNaN(parsed)) { return 0; }
  return parsed;
}

/**
 * 文字列←→Unicode
 * 文字列換算での1文字分ずつ処理します。
 */
let Converter = {};
/**
 * 文字列→文字コードに変換し、コールバック関数を呼び出し、処理した値を返します。
 * @param {string} c 変換する1字
 * @param {Function} callback コールバック関数。引数は16進数int
 * @returns {string} 4or8文字のUnicode
 */
Converter.encode = function (c, callback) {
  let result;
  const codePoint = c.charCodeAt(0);
  if (0xd800 <= codePoint && codePoint <= 0xdbff) {
    const H = codePoint;
    const L = c.charCodeAt(1);
    result = callback(H) + callback(L)
  }
  else if (codePoint < 0xd800 || 0xdfff < codePoint) {
    result = callback(codePoint);
  } else { console.error("unknown codePoint at encode") }
  return result;
};

/**
 * n進文字コードUnicode(文節後にセパレータ無し)→文字列
 * @param {string} text 変換する1字分のn進文字コード　00abc　形式
 * @returns 
 */
Converter.decode = function (c) {
  if (!c) { console.error("unknown character"); return "𛀂"; }
  if (c < 0x20 || 0xfffff < c) { console.error("unknown character: " + c); return "𛀂"; }
  const result = String.fromCodePoint(c);
  if (!result) {
    console.error("unknown character: " + result)
    return "𛀂";
  }
  return result
};

class Coder {
  /**
   * 
   * @param {string} characters 任意　変換に使う文字列。1文字の集合。最初1文字は区切りに使われる。最短：3　最長：37
   * @param {RegExp} regs 任意　ヒットした文字を変換しない正規表現オブジェクト。1文字の集合。
   * @param {RegExp} escapeReg 任意　ヒットした箇所を変換しない正規表現オブジェクト。(ｶｯｺ)で括ることで、str.splitが区切り文字列ごと返してくれる。
   */
  constructor(
    characters = "っぺペ",
    //regs = /([、。！!？\?「」\[\]【】（）\(\)ww/0-9\n　 𛀂])/g,
    regs = new RegExp(DefaultReg, "g"),
    escapeReg = /(＜[^＞]*＞)/g
  ) {
    this._separator = characters.slice(0, 1);//"っ"
    this._characters = Array.from(characters.slice(1));//["ぺ", "ペ"]
    this._baseNum = this._characters.length;//2

    this._escapeReg = escapeReg;
    this._regs = regs;
  }

  encodeFunction = function (e, targetObj) {
    let result = "";
    const inputValue = e.currentTarget.value;
    if (inputValue) {
      result = this.codingFunc(inputValue, this.encedePe);
      if (result.slice(-1) == this._separator) {
        result = result.slice(0, -1)
      }
    }
    targetObj.setValue(result);
    return result;
  }
  decodeFunction = function (e, targetObj) {
    let result = "";
    let inputValue = e.currentTarget.value;
    if (inputValue) {
      if (inputValue.slice(-1) !== this._separator) {
        inputValue += this._separator
      }
      result = this.codingFunc(inputValue, this.decedePe)
    }
    targetObj.setValue(result);
    return result;
  }

  codingFunc(inputValue, callback) {

    const escapeReg = this._escapeReg;
    const regs = this._regs;
    const result = escapeProcess(inputValue, escapeReg, function (s) {
      return escapeProcess(s, regs, callback, this);
    }, this)
    return result;
  }

  /**
 * 連続した文字列をぺ文書に変換
 * @param {string} text 文字列
 * @param {Integer} baseNum 
 * @returns result
 */
  encedePe(text) {
    const characters = this._characters;
    const baseNum = this._baseNum;
    const separator = this._separator;
    const result = Array.from(text).reduce((previousValue, currentValue) => {
      const re = Converter.encode(currentValue,
        function (n) {
          n = n.toString(baseNum)
          return Array.from(n).reduce((previousValue, currentValue) => previousValue + characters[to10Scale(currentValue, baseNum)], "") + separator;
        }
        , baseNum);
      return previousValue + re
    }, "")
    return result;
  }

  /**
   * 連続したぺ文書を文字列に変換
   * @param {string} text ぺ文字列
   * @param {Integer} baseNum 
   * @returns 
   */
  decedePe(text) {
    const characters = this._characters;
    const baseNum = this._baseNum;
    const separator = this._separator;

    const codeSeparator = "|"

    const pattern = new RegExp("(?:\\w)*(?:" + codeSeparator + ")", "gi");
    let numbersStr = "";
    for (let i = 0; i < text.length; i++) {
      let re = text[i]
      if (re == separator) {
        re = codeSeparator;
      } else {
        re = characters.indexOf(re)
        if (re < 0) { re = ""; }
      }
      numbersStr += re
    }

    const matches = numbersStr.match(pattern)
    let result = "";
    if (!matches) { return "" }
    matches.forEach(match => {
      if (!match) { return; }
      result += Converter.decode(parseInt(match, baseNum))
    })
    return result;
  }
}

function escapeProcess(str, reg, callback, caller = this) {
  let i = 0;
  let result = "";
  let match;
  while ((match = reg.exec(str)) !== null) {
    const ind = match.index;
    result += callback.call(caller, str.slice(i, ind)) + match[0]
    i = reg.lastIndex;
  }

  result += callback.call(caller, str.slice(i))
  return result;
}
