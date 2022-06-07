'use strict';

window.addEventListener('load', function () {
  createNewCoder(undefined,undefined,undefined,true)
  $("characterInputButton").onclick = onInputButtonClick;
  $("characterInputRegs").value = DefaultReg;
  $('loading').style.display = 'none';
  $('loaded').style.display = 'block';
})

class CodeInput {
  constructor(parentNode) {
    this._parentNode = parentNode;
  }
  activate(coder, onChangeFunc, subjectElem) {
    const func = this._func = function (e) { onChangeFunc.call(coder, e, subjectElem) };
    this._e = this._parentNode.appendChild(makeElement({ type: "textarea", cls: "codeInput", listeningEvent: "input" /*"change"*/, onEventFunction: func }))
  }
  setValue(val) { return this._e.value = val }
}

/**
 * new しただけで全ての準備が完了します。あとはユーザの入力を待つだけです。
 * @param {Node} parentNode 親Node
 * @param {string} characters 任意　変換に使う文字列。1文字の集合。最初1文字は区切りに使われる。最短：3　最長：37
 * @param {RegExp} regs 任意　ヒットした文字を変換しない正規表現オブジェクト。1文字の集合。
 * @param {RegExp} escapeReg 任意　ヒットした箇所を変換しない正規表現オブジェクト。(ｶｯｺ)で括ることで、str.splitが区切り文字列ごと返してくれる。
 */
class CoderSet {
  constructor(parentNode, characters, regs, escapeReg, isFrist) {
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


    const coder = this._coder = new Coder(characters, regs, escapeReg)

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
  const val = el.value
  if (!val) { window.alert("変換に使用する文字列を入力してください。"); return; }
  if (!checkInputCharacters(val)) { window.alert("入力された変換用テキストが不適切です。\n3文字以上37文字以下で、重複の無いように入力してください。"); return; }

  let regs;
  const elR = $("characterInputRegs")
  if (!elR) { console.error("Element: characterInputRegs is undefind."); return; }
  const valR = elR.value
  if (valR) { regs = new RegExp(valR, "g") }

  let escapeReg;

  createNewCoder(val, regs, escapeReg)
  el.value = "";
  elR.value = DefaultReg;
}
/**
* @param {string} characters 任意　変換に使う文字列。1文字の集合。最初1文字は区切りに使われる。最短：3　最長：37
* @param {RegExp} regs 任意　ヒットした文字を変換しない正規表現オブジェクト。1文字の集合。
* @param {RegExp} escapeReg 任意　ヒットした箇所を変換しない正規表現オブジェクト。(ｶｯｺ)で括ることで、str.splitが区切り文字列ごと返してくれる。
*/
function createNewCoder(characters = undefined, regs, escapeReg,isFrist) {
  new CoderSet($("field"), characters, regs, escapeReg,isFrist)
}

function checkInputCharacters(c) {
  if (c.length < 3 || 37 < c.length) { return false; }
  const ar = Array.from(c)
  for (let i = 0; i < ar.length; i++) {
    if (ar.includes(ar[i], i + 1)) { return }
  }
  return ar;
}

