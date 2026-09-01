function sendOrderWhatsApp(){
  if(!currentOrder)return;

  const o=currentOrder;

  const items=o.items.map(i =>
    `• ${i.name} × ${i.quantity} = ₹${(
      Number(i.price)*Number(i.quantity)
    ).toLocaleString("en-IN")}`
  ).join("\n");

  const msg =
`*BUYZO NEW ORDER*

Order ID: ${o.orderId}
Name: ${o.name}
Mobile: ${o.mobile}
Address: ${o.address}, ${o.city}, ${o.state} - ${o.pincode}
Payment: ${o.payment}

*Items:*
${items}

*Total: ₹${o.total.toLocaleString("en-IN")}*`;

  const number = WHATSAPP_NUMBER.replace(/\D/g,"");

  if(number.length < 10){
    alert("WhatsApp number sahi se set nahi hai.");
    return;
  }

  window.open(
    "https://wa.me/" + number +
    "?text=" + encodeURIComponent(msg),
    "_blank"
  );
}
