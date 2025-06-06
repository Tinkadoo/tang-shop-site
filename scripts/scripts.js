const STORAGE_KEY = "cart";
let cartData = loadCart();


const cartItemsContainer = document.getElementById("cart-items");
const subtotalEl = document.getElementById("subtotal");
const checkoutBtn = document.getElementById("checkout-btn");
const emptyMessage = document.getElementById("empty-message");
const placeOrderBtn = document.getElementById("place-order-btn");

function nextImage(button) {
    const slider = button.closest('.product-card').querySelectorAll('.slider-img');
    let currentIndex = Array.from(slider).findIndex(img => img.classList.contains('active'));
  
    // Remove 'active' from current
    slider[currentIndex].classList.remove('active');
  
    // Add 'active' to next (wrap around)
    const nextIndex = (currentIndex + 1) % slider.length;
    slider[nextIndex].classList.add('active');
  }
  
function prevImage(button) {
  const slider = button.closest('.product-card').querySelectorAll('.slider-img');
  let currentIndex = Array.from(slider).findIndex(img => img.classList.contains('active'));

  // Remove 'active' from current
  slider[currentIndex].classList.remove('active');

  // Add 'active' to previous (wrap around)
  const prevIndex = (currentIndex - 1 + slider.length) % slider.length;
  slider[prevIndex].classList.add('active');
}

function updateCartCount() {

  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((sum, item) => sum + (item.qty || 0), 0);

  const badge = document.getElementById('cart-count-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function getQtyControlsHTML(index, qty) {
  return `
    <div class="flex items-center justify-center space-x-2 py-1 mt-2">
      <button onclick="updateQuantity(${index}, -1)"
        class="bg-yellow-300 hover:bg-yellow-500 text-black text-base font-semibold w-10 h-8 rounded-md shadow flex items-center justify-center transition-all">
        −
      </button>
      <span class="min-w-[24px] w-6 text-center text-sm font-semibold">${qty}</span>
      <button onclick="updateQuantity(${index}, 1)"
        class="bg-yellow-300 hover:bg-yellow-500 text-black text-base font-semibold w-10 h-8 rounded-md shadow flex items-center justify-center transition-all">
        +
      </button>
    </div>
  `;
}

  
function addToCart(name, price, imageUrl, containerId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item => item.name === name);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ name, price, qty: 1, image: imageUrl });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();

  const container = document.getElementById(containerId);
  const itemIndex = cart.findIndex(item => item.name === name);
  container.innerHTML = getQtyControlsHTML(itemIndex, cart[itemIndex].qty);
  // container.innerHTML = `<div class="text-black font-semibold mt-4 text-sm">In cart</div>`;
}


function loadCart() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}
      
function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cartData));
}
  
      
function renderCart() {
  cartItemsContainer.innerHTML = "";

  if (cartData.length === 0) {
    emptyMessage.classList.remove("hidden");
    checkoutBtn.disabled = true;

    // 🧹 Reset all values when cart is empty
    document.getElementById("subtotal").textContent = "$0.00";
    document.getElementById("tax").textContent = "$0.00";
    document.getElementById("paypal-fee").textContent = "$0.00";
    document.getElementById("total").textContent = "$0.00";

    return;
  } else {
    emptyMessage.classList.add("hidden");
  }

  cartData.forEach((item, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "flex items-center justify-between border-b pb-2";

    const imageUrl = item.image || "https://cdn-icons-png.flaticon.com/512/2917/2917990.png";

    itemEl.innerHTML = `
      <div class="flex items-center space-x-4">
        <img src="${imageUrl}" alt="${item.name}" class="w-14 h-14 object-cover rounded">
        <div>
          <p class="font-semibold">${item.name}</p>
          <p class="text-sm text-gray-500">$${item.price.toFixed(2)} each</p>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="updateQuantity(${index}, -1)" class="px-2 bg-gray-200 rounded">−</button>
        <input type="number" value="${item.qty}" min="1" class="w-12 text-center border rounded" onchange="setQuantity(${index}, this.value)">
        <button onclick="updateQuantity(${index}, 1)" class="px-2 bg-gray-200 rounded">+</button>
        <button onclick="removeItem(${index})" class="ml-3 text-red-600">🗑️</button>
      </div>
    `;
    cartItemsContainer.appendChild(itemEl);
  });

  updateSubtotal();
}

function calculateTotal() {
  const subtotal = cartData.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.0825;
  const fee = subtotal > 0 ? (subtotal * 0.0299 + 0.49) : 0;
  const total = subtotal + tax + fee;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    fee: parseFloat(fee.toFixed(2)),
    total: parseFloat(total.toFixed(2))
  };
}


function updateSubtotal() {
  const { subtotal, tax, fee, total } = calculateTotal();

  // Update UI
  document.getElementById("subtotal").textContent = `$${subtotal}`;
  document.getElementById("tax").textContent = `$${tax}`;
  document.getElementById("paypal-fee").textContent = `$${fee}`;
  document.getElementById("total").textContent = `$${total}`;

  updateCheckoutState();
}


function updateQuantity(index, change) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  if (!cart[index]) return;

  cart[index].qty = Math.max(1, cart[index].qty + change);
  localStorage.setItem('cart', JSON.stringify(cart));
  cartData = cart; // Keep in sync
  updateCartCount();

  // Determine whether we are on the cart page or shop page
  const isCartPage = !!document.getElementById("cart-items");

  if (isCartPage) {
    renderCart(); // Full re-render for cart page
  } else {
    // Update just the quantity controls in-place for shop page
    const item = cart[index];
    const containerId = item.name.replace(/\s+/g, '-').toLowerCase() + '-btn';
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = getQtyControlsHTML(index, item.qty);
    }
  }
}

      
function removeItem(index) {
    cartData.splice(index, 1);
    saveCart();
    renderCart();
    updateCartCount();
}


function updateCheckoutState() {
  const { subtotal } = calculateTotal();
  const isDisabled = cartData.length === 0 || subtotal < 10;

  if (checkoutBtn) {
    checkoutBtn.disabled = isDisabled;
    checkoutBtn.classList.toggle("opacity-50", isDisabled);
    checkoutBtn.classList.toggle("pointer-events-none", isDisabled);
  }

  const warning = document.getElementById("min-order-warning");
  if (warning) {
    warning.classList.toggle("hidden", subtotal >= 10);
  }
}



const supabase = window.supabase.createClient(
  'https://zfkbcmrvbmsikabwpjrh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpma2JjbXJ2Ym1zaWthYndwanJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MTY2MTAsImV4cCI6MjA2NDA5MjYxMH0.kQ6g8Ief2IRDzWMsatT2KtxfROHDT1HvGll7mMNsSg8'
);

async function loadInventory(selectedCategory = "All") {

  const container = document.getElementById("product-list");
  const categoryBtnContainerDesktop = document.getElementById("categoryButtonsDesktop");
  const mobileCategorySelect = document.getElementById("mobile-category-select");

  if (!container || !categoryBtnContainerDesktop) return;
 // Skip on pages other than shop.html

  const { data, error } = await supabase.from("inventory").select("*");

  if (error) {
    console.error("❌ Error loading inventory:", error.message);
    return;
  }

  // 🧼 Filter inventory by selected category
  const filtered = selectedCategory === "All"
    ? data
    : data.filter(item => item.category === selectedCategory);

  // ✅ Create unique category buttons dynamically
  const allCategories = [...new Set(data.map(item => item.category))].sort();
  const categories = ["All", ...allCategories];

  categoryBtnContainerDesktop.innerHTML = "";
  if (mobileCategorySelect) {
    mobileCategorySelect.innerHTML = "";
  }  

  categories.forEach(cat => {
    const label = cat === "All"
      ? "All"
      : cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  
    const createBtn = () => {
      const btn = document.createElement("button");
      btn.textContent = label;
      btn.className = `
        flex items-center justify-center
        min-w-fit max-w-full
        px-4 py-1 text-sm
        border border-gray-300 rounded-full
        whitespace-nowrap overflow-hidden truncate
        hover:bg-yellow-200
        ${cat === selectedCategory ? 'bg-yellow-400 text-white font-semibold' : ''}
      `;

      if (mobileCategorySelect) {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = label;
        mobileCategorySelect.appendChild(option);
      }
      
      btn.addEventListener("click", () => loadInventory(cat));
      return btn;
    };
  
    // categoryBtnContainerMobile.appendChild(createBtn());
    categoryBtnContainerDesktop.appendChild(createBtn());
  });

  if (mobileCategorySelect) {
    mobileCategorySelect.value = selectedCategory;
    mobileCategorySelect.onchange = (e) => loadInventory(e.target.value);
  }  

  // 🧸 Render product cards
  container.innerHTML = "";

  filtered.forEach(item => {

    const safeName = item.name.replace(/\s+/g, '-').toLowerCase();
    const imageFolder = item.image_path;
    const imageList = item.image_list || [];

    // Build dynamic image slider HTML
    const imageSlides = imageList.map((filename, index) => {
      const activeClass = index === 0 ? 'active' : '';
      // return `<img src="../${imageFolder}/${filename}" class="slider-img ${activeClass} rounded-md" />`;
      return `<img src="../${imageFolder}/${filename}" class="slider-img ${activeClass} h-50 w-full object-contain rounded-md" />`;

    }).join('');

    const card = document.createElement("div");
    card.className = "product-card bg-white rounded-lg p-4 shadow-md";

    card.innerHTML = `
 
      <div class="image-slider relative group">
      ${imageSlides}
        <div class="absolute inset-0 flex justify-between items-center px-2 
            opacity-100 sm:opacity-0 sm:group-hover:opacity-70 transition-opacity">
          <button onclick="prevImage(this)" class="bg-white text-black rounded-full p-2 shadow">&larr;</button>
          <button onclick="nextImage(this)" class="bg-white text-black rounded-full p-2 shadow">&rarr;</button>
        </div>
      </div>

      <div class="text-center">

        <h3 class="text-ml mt-3">${item.name}</h3>
        <div class="mt-1 mb-1">
          <p class="text-pink-600 font-bold text-lg">$${item.price.toFixed(2)} each</p>
          <span class="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium mt-1">
            In Stock: ${item.stock}
          </span>
        </div>
        <div id="${safeName}-btn">
          <button
            onclick="addToCart('${item.name}', ${item.price}, '../${imageFolder}/${imageList[0]}', '${safeName}-btn')"
            class="bg-yellow-300 text-black font-semibold w-full rounded-lg py-2 mt-2 text-sm 
                  ${item.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-500'}"
            ${item.stock === 0 ? 'disabled' : ''}>
            ${item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  loadInventory();

  // Contact form logic
  const contactForm = document.getElementById('contact-form');
  const sendBtn = document.getElementById('send-button');
  const thankYouMsg = document.getElementById('thank-you-message');

  if (contactForm && sendBtn && thankYouMsg) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const contactFormData = new FormData(contactForm);
      fetch("https://formsubmit.co/57c9d1f17018a7ef4c41876a3b269243", {
        method: "POST",
        body: contactFormData,
        headers: { Accept: "application/json" }
      })
        .then(response => {
          if (response.ok) {
            sendBtn.classList.add("hidden");
            thankYouMsg.classList.remove("hidden");
            contactForm.reset();
          } else {
            sendBtn.innerText = "Something went wrong. Try again.";
          }
        })
        .catch(() => {
          sendBtn.innerText = "Submission failed. Try again.";
        });
    });
  }

  if (cartItemsContainer) {
    renderCart();
  }

  // ✅ New: Checkout page logic
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const checkoutForm = document.getElementById("checkout-form");
  const confirmation = document.getElementById("order-confirmation");
  const paypalButtonContainer = document.getElementById("paypal-button-container");

  if (checkoutForm && confirmation) {

    if (cart.length === 0) window.location.href = "cart.html";

    const requiredFields = [
      'name',
      'phone',
      'email',
      'address',
      'city'
    ];
    
    const inputElements = requiredFields.map(field =>
      checkoutForm.querySelector(`input[id="${field}"]`)
    );
    
    // Enable PayPal button only if all required fields are filled
    function validateFormInputs() {
      const allFilled = inputElements.every(input => input.value.trim());
      if (allFilled) {
        paypalButtonContainer.classList.remove("pointer-events-none", "opacity-50");
      }
    }
    
    // Add input event listener to each required input
    inputElements.forEach(input => {
      input.addEventListener("input", validateFormInputs);
    });
    
  }

  // ✅ Only render PayPal button if SDK loaded and container exists
  if (typeof paypal !== 'undefined' && document.getElementById("paypal-button-container")) {
    paypal.Buttons({
      createOrder: function(data, actions) {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        console.log(subtotal, tax, fee, total)
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: total
            }
          }]
        });
      },
      onApprove: async function(data, actions) {
        const details = await actions.order.capture();
          
        // Build order data
        const orderData = {
          name: document.getElementById("name").value,
          phone: document.getElementById("phone").value,
          email: document.getElementById("email").value,
          address: document.getElementById("address").value,
          city: document.getElementById("city").value,
          state: document.getElementById("state").value,
          zip: document.getElementById("zip-checkout").value,
          notes: document.getElementById("notes").value,
          items: cart,
          payment_id: details.id,
          amount: details.purchase_units[0].amount.value,
          source: window.location.origin,
          created_at: new Date().toISOString()
        };

        // Save to Supabase
        const { error } = await supabase.from("orders").insert([orderData]);

        if (!error) {
          confirmation.classList.remove("hidden");
          checkoutForm.classList.add("hidden");
          localStorage.removeItem("cart");
          updateCartCount();
        } else {
          alert("Failed to save order.");
          console.error("Supabase error:", error.message);
        }
      }
    }).render('#paypal-button-container');
  }
});


