const recommendations = {

    dosa: ["Idli", "Pongal", "Vada"],

    idli: ["Dosa", "Upma", "Vada"],

    biryani: ["Veg Meals", "Fried Rice"],

    "veg meals": ["Biryani", "Curd Rice"],

    samosa: ["Pakoda", "Cutlet"],

    pakoda: ["Samosa", "Bajji"],

    laddu: ["Mysore Pak", "Gulab Jamun"],

    "gulab jamun": ["Laddu", "Rasgulla"],

    chapati: ["Paneer Curry", "Dal Rice"],

    "fried rice": ["Biryani", "Noodles"]
};

function recommend(food) {

    const result = recommendations[food];

    const box =
        document.getElementById("recommendation");

    if(result){

        box.innerHTML = `
            <h2>${food.toUpperCase()}</h2>
            <p>
                Recommended Foods:
                ${result.join(", ")}
            </p>
        `;
    }
}

function searchFood() {

    let input =
        document.getElementById("search")
        .value
        .toLowerCase();

    let cards =
        document.querySelectorAll(".card");

    cards.forEach(card => {

        let foodName =
            card.querySelector(".food-name")
            .innerText
            .toLowerCase();

        if(foodName.includes(input)){

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

}
let selectedFood = "";
let selectedPrice = 0;

function openOrderModal(food, price){

    selectedFood = food;
    selectedPrice = price;

    document.getElementById("foodName").innerHTML =
    food;

    document.getElementById("orderModal")
    .style.display = "block";
}

function closeModal(){

    document.getElementById("orderModal")
    .style.display = "none";
}

function calculateBill(){

    let quantity =
    document.getElementById("quantity").value;

    let deliveryCharge = 20;

    let total =
    (selectedPrice * quantity)
    + deliveryCharge;

    document.getElementById("totalPrice")
    .innerHTML =
    "Total Price: ₹" + total;
}

function confirmOrder(){

    let name =
    document.getElementById("customerName").value;

    let phone =
    document.getElementById("customerPhone").value;

    let address =
    document.getElementById("customerAddress").value;

    if(
        name === "" ||
        phone === "" ||
        address === ""
    ){

        alert("Please fill all details");

        return;
    }

    let deliveryTime =
    Math.floor(Math.random()*15)+20;

    document.querySelector(".modal-content")
    .innerHTML = `

        <div class="success">

            <div class="tick">
                ✓
            </div>

            <h2>
                Order Confirmed
            </h2>

            <p>
                Thank You ${name}
            </p>

            <p>
                Your ${selectedFood}
                order has been placed.
            </p>

            <p>
                Delivery Time:
                ${deliveryTime}-${deliveryTime+5}
                Minutes
            </p>

        </div>

    `;
    let history =
document.getElementById("history");

history.innerHTML += `
<p>
✅ ${selectedFood}
 ordered by ${name}
</p>
`;
}