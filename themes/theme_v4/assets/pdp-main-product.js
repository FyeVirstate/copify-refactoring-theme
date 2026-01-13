document.addEventListener("DOMContentLoaded", function () {

  document.querySelectorAll('.quantity-break-option-container').forEach((el)=>{
    el.querySelector('label').addEventListener('click', (target)=>{
      target.preventDefault();
      target.target.closest('.quantity-break-form').querySelectorAll('.quantity-break-option-container').forEach((elm)=>{ elm.querySelector('label').classList.remove('selected'); })
      target.target.closest('.quantity-break-option-container').querySelector('label').classList.add('selected');
    })
  })

  class PurchaseSelection extends HTMLElement {
    constructor() {
      super();
      this.attachEvents();
    }
    attachEvents() {
      this.querySelectorAll(`.quantity-break-variant-select`).forEach(input => {
        input.addEventListener('change', () => {
          this.syncVariants();
        });
      });
    }
    syncVariants() {
      this.selectedValue();
      this.selectMasterVariant(this.choosedOneTime);
      this.UpdateAppearance('onetime');
    }
    selectedValue() {
      this.choosedOneTime = [...this.querySelectorAll('select')].map(select => select.value);
    }
    getVariantData() {
      return this.variantData ||= JSON.parse(this.querySelector('[type="application/json"]').textContent);
    }
    selectMasterVariant(choices) {
      this.currentVariant = this.getVariantData().find(variant =>
        !variant.options.some((opt, idx) => opt !== choices[idx])
      );
    }
    UpdateAppearance(type) {
      const submitBtns = document.querySelectorAll(`.product__info-container .product-form__submit[type="submit"]`);            
      if (!this.currentVariant) return;
      this.indexIdQty = this.dataset.index;
      this.closest(`.quantity-break-option-container[data-qty-v-id-${this.indexIdQty}]`).setAttribute(`data-qty-v-id-${this.indexIdQty}`, this.currentVariant.id);
      this.closest(`.quantity-break-variant-selectors[data-item-index="${this.indexIdQty}"]`).querySelector('.selected-variant-name').innerHTML = `(${this.currentVariant.title})`;
      const isAvailable = this.currentVariant.available;
      const soldOut = !isAvailable;
      const btnText = soldOut ? window.variantStrings.soldOut : window.variantStrings.addToCart;
      [...submitBtns].forEach(btn => {
        const label = btn.querySelector('span');
        if (label) label.innerHTML = btnText;
        btn.disabled = soldOut;
      });
    }
  }
  customElements.define('cus-qty-bk', PurchaseSelection);

  if( document.querySelectorAll('.js-qty-breakdown.product-form__submit[name="add"]').length > 0 ){
      document.querySelector('.js-qty-breakdown.product-form__submit[name="add"]').addEventListener('click', (e) => {
        e.preventDefault();
        let allSelectedValueIds = [];
        let selectedQtyDsk = document.querySelector('.quantity-break-option.selected').closest('.quantity-break-option-container').dataset.optionQuantity;
        let selectedQtyDskMax = parseInt(selectedQtyDsk);
        for (let i = 0; i < selectedQtyDskMax; i++) {
            var idsV = document.querySelector('.quantity-break-option.selected').closest(`.quantity-break-option-container[data-qty-v-id-${i}]`).getAttribute(`data-qty-v-id-${i}`);
            allSelectedValueIds.push({id: idsV,quantity: 1});
        }        
        const submitBtnWp = e.target;
        submitBtnWp.classList.add('loading');
        submitBtnWp.querySelector('.loading__spinner').classList.remove('hidden');
        submitBtnWp.disabled = true;
        const cartDrawer = document.querySelector('cart-drawer');
        const bundleCart = {
          items: allSelectedValueIds,
          sections: cartDrawer?.getSectionsToRender()?.map(s => s.id) || [],
          sections_url: window.location.pathname
        };
        fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(bundleCart),
          credentials: 'same-origin'
        }).then(res => res.json())
          .then( data => cartDrawer?.renderContents(data))
          .catch(console.error)
          .finally(() => {
            if (cartDrawer) {
              if (cartDrawer.classList.contains('is-empty')) cartDrawer.classList.remove('is-empty');
              cartDrawer.open();
            }
            submitBtnWp.classList.remove('loading');
            submitBtnWp.querySelector('.loading__spinner').classList.add('hidden');
            submitBtnWp.disabled = false;
          });
      });
  }

  document.querySelectorAll(".upsellProducts__grid").forEach(upsellBox => {
    let addBtn = upsellBox.querySelector(".upsellProducts__grid__button");
    let currentVariantId = null;

    function getSelectedVariantId() {
      let selects = upsellBox.querySelectorAll(".upsellProducts__grid__variants_selection");
      let selectedOptions = [];
      selects.forEach(sel => selectedOptions.push(sel.value.trim().toLowerCase()));
      let matchedVariant = null;

      upsellBox.querySelectorAll(".variants-detail .var-cstm").forEach(v => {
        let title = v.innerText.trim().toLowerCase();
        let allMatched = selectedOptions.every(opt => title.includes(opt));
        if (allMatched) matchedVariant = v.id;
      });
      return matchedVariant;
    }

    upsellBox.querySelectorAll(".upsellProducts__grid__variants_selection").forEach(sel => {
      sel.addEventListener("change", () => currentVariantId = getSelectedVariantId());
    });

    addBtn.addEventListener("click", function () {
      if (!currentVariantId) currentVariantId = getSelectedVariantId();
      if (!currentVariantId) return;

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentVariantId,
          quantity: 1
        })
      })
      .then(r => r.json())
      .then(data => {

        fetch('/cart?section_id=cart-drawer')
          .then(r => r.text())
          .then(html => {
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, "text/html");
            let newDrawer = doc.querySelector("cart-drawer");
            let oldDrawer = document.querySelector("cart-drawer");
            if (newDrawer && oldDrawer) {
              oldDrawer.innerHTML = newDrawer.innerHTML;
              setTimeout(() => {
                if (window.cartDrawer?.open) window.cartDrawer.open();
                else if (window.theme?.cartDrawer?.open) window.theme.cartDrawer.open();
                else if (oldDrawer?.open) oldDrawer.open();
              }, 1000);
            }
          });
       
          fetch('/cart.js')
            .then(response => response.json())
            .then(cart => {
              const countEl = document.querySelector("[data-cart-count]");
              if (countEl) countEl.textContent = cart.item_count;
              const cartCountBubble = document.querySelector('.cart-count-bubble');
              if (cartCountBubble) cartCountBubble.textContent = cart.item_count;
            })
            .catch(error => console.error('Error fetching cart data:', error));
      });
    });
  });

});
