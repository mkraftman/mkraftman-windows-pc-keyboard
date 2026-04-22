/**
 * mkraftman-windows-pc-keyboard
 * Always-active keyboard input card for Windows PC via Unified Remote.
 * Modelled after the Apple TV keyboard card but permanently in active mode.
 * Sends individual keystrokes via unified_remote.call -> Relmtech.Keyboard.
 */

class MkraftmanWindowsPCKeyboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._el = {};
    this._built = false;
    this._lastValue = "";
    this._savedScrollY = null;
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = config || {};
    if (this._hass && !this._built) this._build();
  }

  getCardSize() {
    return 2;
  }

  getGridOptions() {
    return { rows: 2, columns: 12, min_rows: 2, min_columns: 6 };
  }

  getLayoutOptions() {
    return { grid_columns: 4, grid_rows: 2 };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    if (!this._built) this._build();
  }

  _build() {
    if (this._built || !this._hass) return;

    const shadow = this.shadowRoot;
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }
        .card {
          background: transparent;
          border-radius: 12px;
          padding: 12px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          height: 100%;
          gap: 8px;
        }

        .kb-btn {
          flex-shrink: 0;
          width: 55px;
          height: 55px;
          border-radius: 0;
          border: none;
          background: transparent;
          color: #A9A9A9;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: opacity 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .kb-btn:active {
          opacity: 0.6;
        }
        .kb-btn ha-icon {
          --mdc-icon-size: 55px;
        }

        .text-display {
          flex: 1;
          font-size: 18px;
          font-weight: 500;
          color: var(--primary-text-color, #fff);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          user-select: none;
          height: 56px;
          line-height: 56px;
          cursor: text;
        }
        .text-display.placeholder {
          opacity: 0.4;
        }

        .clear-btn {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(var(--rgb-blue, 68, 115, 158), 0.2);
          color: var(--primary-text-color, #fff);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
          transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .clear-btn:active {
          background: rgba(var(--rgb-blue, 68, 115, 158), 0.35);
        }

        .hidden-input {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 1px;
          opacity: 0;
          border: none;
          outline: none;
          padding: 0;
          margin: 0;
          font-size: 16px;
          color: transparent;
          caret-color: transparent;
          background: transparent;
          pointer-events: none;
          -webkit-appearance: none;
          -webkit-text-fill-color: transparent;
        }
      </style>

      <div class="card">
        <button class="kb-btn" id="kbBtn">
          <ha-icon icon="mdi:keyboard-outline"></ha-icon>
        </button>
        <div class="text-display placeholder" id="textDisplay">Tap keyboard to type...</div>
        <button class="clear-btn" id="clearBtn">&times;</button>
        <input class="hidden-input" id="hiddenInput" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      </div>
    `;

    this._el.kbBtn = shadow.getElementById("kbBtn");
    this._el.textDisplay = shadow.getElementById("textDisplay");
    this._el.clearBtn = shadow.getElementById("clearBtn");
    this._el.hiddenInput = shadow.getElementById("hiddenInput");

    this._el.kbBtn.addEventListener("click", () => this._activate());

    this._el.textDisplay.addEventListener("click", () => {
      this._el.hiddenInput.style.pointerEvents = "auto";
      this._el.hiddenInput.focus();
    });

    this._el.hiddenInput.addEventListener("input", () => this._handleInput());

    this._el.hiddenInput.addEventListener("keydown", (e) => this._handleKeyDown(e));

    this._el.clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this._clearInput();
    });

    this._built = true;
  }

  _activate() {
    this._savedScrollY = null;
    this._el.hiddenInput.value = "";
    this._lastValue = "";
    this._updateTextDisplay("");
    this._el.hiddenInput.style.pointerEvents = "auto";
    this._el.hiddenInput.focus();

    setTimeout(() => {
      this.scrollIntoView({ behavior: "smooth", block: "end" });
      setTimeout(() => {
        this._savedScrollY = window.scrollY;
      }, 500);
    }, 300);
  }

  _handleInput() {
    const newValue = this._el.hiddenInput.value;
    const oldValue = this._lastValue;

    if (newValue.length > oldValue.length) {
      const added = newValue.substring(oldValue.length);
      for (const char of added) {
        this._sendKey(this._mapKey(char));
      }
    } else if (newValue.length < oldValue.length) {
      const count = oldValue.length - newValue.length;
      for (let i = 0; i < count; i++) {
        this._sendKey("back");
      }
    }

    this._lastValue = newValue;
    this._updateTextDisplay(newValue);

    if (this._savedScrollY !== null) {
      requestAnimationFrame(() => {
        window.scrollTo(0, this._savedScrollY);
      });
    }
  }

  _handleKeyDown(e) {
    if (e.key === "Enter") {
      this._sendKey("return");
      e.preventDefault();
    } else if (e.key === "Escape") {
      this._sendKey("escape");
      e.preventDefault();
    } else if (e.key === "Tab") {
      this._sendKey("tab");
      e.preventDefault();
    }
  }

  _mapKey(char) {
    if (char === " ") return "space";
    return char;
  }

  _sendKey(key) {
    if (!this._hass) return;
    this._hass.callService("unified_remote", "call", {
      remote_id: "Relmtech.Keyboard",
      action: "stroke",
      extras: { Values: [{ Value: key }] },
    });
  }

  _clearInput() {
    this._el.hiddenInput.value = "";
    this._lastValue = "";
    this._updateTextDisplay("");
    this._el.hiddenInput.blur();
    this._el.hiddenInput.style.pointerEvents = "none";
  }

  _updateTextDisplay(text) {
    if (text.length > 0) {
      this._el.textDisplay.textContent = text;
      this._el.textDisplay.classList.remove("placeholder");
    } else {
      this._el.textDisplay.textContent = "Tap keyboard to type...";
      this._el.textDisplay.classList.add("placeholder");
    }
  }

  connectedCallback() {
    if (this._hass && this._config && !this._built) {
      this._build();
    }
  }
}

customElements.define("mkraftman-windows-pc-keyboard", MkraftmanWindowsPCKeyboard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "mkraftman-windows-pc-keyboard",
  name: "Mkraftman Windows PC Keyboard",
  description: "Always-active keyboard input for Windows PC via Unified Remote.",
});
