/**
 * mkraftman-windows-pc-keyboard
 * Always-active keyboard input card for Windows PC via Unified Remote.
 * Minimalist: centered keyboard icon opens native keyboard.
 * Characters are sent directly to the PC without local display.
 */

class MkraftmanWindowsPCKeyboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
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
    return 1;
  }

  getGridOptions() {
    return { rows: 1, columns: 12, min_rows: 1, min_columns: 6 };
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
          position: relative;
        }
        .card {
          background: transparent;
          padding: 8px 12px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kb-btn {
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
        .hidden-input {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 1px;
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
        <input class="hidden-input" id="hiddenInput" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
      </div>
    `;
    const kbBtn = shadow.getElementById("kbBtn");
    const hiddenInput = shadow.getElementById("hiddenInput");
    kbBtn.addEventListener("click", () => {
      this._savedScrollY = null;
      hiddenInput.value = "";
      this._lastValue = "";
      hiddenInput.style.pointerEvents = "auto";
      hiddenInput.focus();
      setTimeout(() => {
        this.scrollIntoView({ behavior: "smooth", block: "end" });
        setTimeout(() => { this._savedScrollY = window.scrollY; }, 500);
      }, 300);
    });
    hiddenInput.addEventListener("input", () => {
      const newValue = hiddenInput.value;
      const oldValue = this._lastValue;
      if (newValue.length > oldValue.length) {
        const added = newValue.substring(oldValue.length);
        for (const char of added) {
          this._sendKey(char === " " ? "space" : char);
        }
      } else if (newValue.length < oldValue.length) {
        const count = oldValue.length - newValue.length;
        for (let i = 0; i < count; i++) { this._sendKey("back"); }
      }
      this._lastValue = newValue;
      if (this._savedScrollY !== null) {
        requestAnimationFrame(() => { window.scrollTo(0, this._savedScrollY); });
      }
    });
    hiddenInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { this._sendKey("return"); e.preventDefault(); }
      else if (e.key === "Escape") { this._sendKey("escape"); e.preventDefault(); }
      else if (e.key === "Tab") { this._sendKey("tab"); e.preventDefault(); }
    });
    this._built = true;
  }

  _sendKey(key) {
    if (!this._hass) return;
    this._hass.callService("unified_remote", "call", {
      remote_id: "Relmtech.Keyboard",
      action: "toggle",
      extras: { Values: [{ Value: key }] },
    });
  }

  connectedCallback() {
    if (this._hass && this._config && !this._built) { this._build(); }
  }
}

customElements.define("mkraftman-windows-pc-keyboard", MkraftmanWindowsPCKeyboard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "mkraftman-windows-pc-keyboard",
  name: "Mkraftman Windows PC Keyboard",
  description: "Keyboard input for Windows PC via Unified Remote.",
});
