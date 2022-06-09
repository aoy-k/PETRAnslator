'use strict';

const about =`
ペトランスレーター ver. 1.1.0
  
  更新履歴
  1.1.1 軽微なデザイン変更。
  1.1.0 新規言語のエスケープ文字列表記方法を変更。新規言語の説明を更新。細かなバグを修正。
  1.0.1 16文字以上の新言語が使用できないバグを修正。
  1.0.0 リリース
`;


const defaultCharacters = "っぺペ";
const defaultEscapeWordsStr = "\\s\\d、。！!？?「」[]【】（）()\\\\/𛀂ww"
const defaultEscapeTagRegExpHead = "＜"
const defaultEscapeTagRegExpBottom = "＞"
const defaultEscapeTagRegExp = new RegExp("\("+defaultEscapeTagRegExpHead+"\[\^"+defaultEscapeTagRegExpBottom+"\]\*"+defaultEscapeTagRegExpBottom+"\)","g")


window.addEventListener('load', function () {
  console.log(about)
  console.log("興味持ってくれてありがとう。\nバグ見つけたら製作者にこっそり教えてあげてね(´・ω・)")
  createNewCoder(undefined, undefined, undefined, true)
  $("characterInputButton").onclick = onInputButtonClick;
  $("characterInputEscapeWords").value = defaultEscapeWordsStr;
  $('loading').style.display = 'none';
  $('loaded').style.display = 'block';
})

class CodeInput {
  constructor(parentNode) {
    this._parentNode = parentNode;
  }
  activate(coder, onChangeFunc, subjectElem) {
    const func = this._func = function (e) { onChangeFunc.call(coder, e, subjectElem) };
    this._e = this._parentNode.appendChild(makeElement({ type: "textarea", cls: "codeInput", listeningEvent: "input" /*"change"*/, onEventFunction: func ,attName:"placeholder",attValue:"ここに入力"}))
  }
  setValue(val) { return this._e.value = val }
}

/**
 * new しただけで全ての準備が完了します。あとはユーザの入力を待つだけです。
 * @param {Node} parentNode 親Node
 * @param {string} characters 変換に使う文字列。1文字の集合。最初1文字は区切りに使われる。最短：3　最長：37
 * @param {RegExp} escapeWordsReg ヒットした文字を変換しない正規表現オブジェクト。1文字の集合。
 * @param {RegExp} escapeTagReg ヒットした箇所を変換しない正規表現オブジェクト。(ｶｯｺ)で括ることで、str.splitが区切り文字列ごと返してくれる。
 */
class CoderSet {
  constructor(parentNode, characters, escapeWordsReg, escapeTagReg, isFrist) {
    this._characters = characters;

    const table = makeElement({ type: "section", cls: "table" });
    const frame1 = table.appendChild(makeElement({ type: "div", cls: "inputFrame" }));
    const frame2 = table.appendChild(makeElement({ type: "div", cls: "inputFrame" }));

    const t1 = makeElement({ type: "div" })
    t1.textContent = "人語"
    frame1.appendChild(t1);
    const t2 = makeElement({ type: "div" })
    t2.textContent = isFrist ? "ぺー語" : "新言語"
    frame2.appendChild(t2);

    const coder = this._coder = new Coder(characters, escapeWordsReg, escapeTagReg)

    const enObj = this._enObj = new CodeInput(frame1)
    const deObj = this._deObj = new CodeInput(frame2)
    enObj.activate(coder, coder.encodeFunction, deObj)
    deObj.activate(coder, coder.decodeFunction, enObj)

    parentNode.appendChild(table);
  }
}

/**
 * data{
 *   type, id, cls, attName, attValue, listeningEvent, onEventFunction
 * }
 */
function makeElement(data) {
  const elem = document.createElement(data.type);
  if (data.id) { elem.id = data.id; }
  if (data.cls) { elem.classList.add(data.cls); }
  if (data.attName) { elem.setAttribute(data.attName, data.attValue) }
  if (data.listeningEvent) { elem.addEventListener(data.listeningEvent, data.onEventFunction,) }
  return elem;
}

function onInputButtonClick() {
  const el = $("characterInput")
  if (!el) { console.error("Element: characterInput is undefind."); return; }
  const str = el.value
  if (!str) { window.alert("変換に使用する文字列を入力してください。"); return; }

  const elR = $("characterInputEscapeWords")
  if (!elR) { console.error("Element: characterInputEscapeWords is undefind."); return; }
  const escapeWordsStr = elR.value
  if (!checkInputCharacters(str, escapeWordsStr)) { window.alert(inputErrorText); return; }
  
  let escapeTagRegExp;

  const re = createNewCoder(str, escapeWordsStr, escapeTagRegExp)
  if(!re){return;}
  el.value = "";
  elR.value = defaultEscapeWordsStr;
}
/**
* @param {string} characters 任意　変換に使う文字列。1文字の集合。最初1文字は区切りに使われる。最短：3　最長：37
* @param {string} escapeWordsStr 任意　ヒットした文字を変換しない文字列。1文字の集合。
* @param {RegExp} escapeTagReg 任意　ヒットした箇所を変換しない正規表現オブジェクト。(ｶｯｺ)で括ることで、str.splitが区切り文字列ごと返してくれる。
*/
function createNewCoder(
  characters = defaultCharacters,
  escapeWordsStr = defaultEscapeWordsStr,
  escapeTagReg = defaultEscapeTagRegExp,
  isFrist
) {
  const escapeWordsReg = (function (regStrInput) {
    let regStr = ""
    const needToEscapeRegExp = /[\-\^\]]/
    const headReg = "([";
    const bottomReg = "])";
    regStr += headReg;
    for (let i = 0; i < regStrInput.length; i++) {
      const c = regStrInput[i]
      if (needToEscapeRegExp.test(c)) { regStr += "\\" }
      regStr += c
    }
    regStr += bottomReg;
    return new RegExp(regStr, "g");
  })(escapeWordsStr)

  if (!checkInputCharactersFromReg(characters, escapeWordsReg, escapeTagReg)) { window.alert(inputErrorText); return; }

  new CoderSet($("field"), characters, escapeWordsReg, escapeTagReg, isFrist)
  return true;
}

const inputErrorText =
  `入力された使用文字が不適切です。以下の要件を満たして下さい。

・3文字以上37文字以下であること
・重複が無いこと
・無変換文字を使用していないこと
・「＜」「＞」を使用していないこと`;

function checkInputCharacters(c) {
  if (c.length < 3 || 37 < c.length) { return false; }
  const ar = Array.from(c)
  for (let i = 0; i < ar.length; i++) {
    if (ar.includes(ar[i], i + 1)) { return }//まだ早くできる
  }
  return true;
}
function checkInputCharactersFromReg(c,  escapeWordsReg, escapeTagReg) {
    for (let i = 0; i < c.length; i++) {
      const t = c[i]
      if (escapeWordsReg.test(t)) { return }
      if(t == defaultEscapeTagRegExpHead){ return }
      if(t == defaultEscapeTagRegExpBottom){ return }
    }
  return true;
}
