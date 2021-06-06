const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));

const nextId = require("../utils/nextId");

// Lists all orders --
function list(req, res, next) {
  res.json({ data: orders });
}

// Checks if order exists --
function doesOrderExist(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    next();
  }
  next({
    status: 404,
    message: `Order ${orderId} does not exist`,
  });
}

// Lists specific Order by id --
function read(req, res, next) {
  res.status(200).json({ data: res.locals.order });
}

// Creates new order --
function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status ? status : "pending",
    dishes: [dishes],
  };
  orders.push(newOrder);

  res.status(201).json({ data: newOrder });
}

// Validates all data in an order --
function validateOrderData(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const stringContentsLetter = /[a-z]/i;
  const stringContentsNum = /[0-9]/;
  let message;

  if (
    !deliverTo ||
    typeof deliverTo !== "string" ||
    !stringContentsLetter.test(deliverTo)
  ) {
    message = `Order must include a deliverTo`;
  } else if (
    !mobileNumber ||
    typeof mobileNumber !== "string" ||
    !stringContentsNum.test(mobileNumber)
  ) {
    message = `Order must include a mobileNumber`;
  } else if (!dishes) {
    message = `Order must include a dish`;
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    message = `Order must include at least one dish`;
  } else {
    for (let i = 0; i < dishes.length; i++) {
      if (
        !dishes[i].quantity ||
        dishes[i].quantity <= 0 ||
        !Number.isInteger(dishes[i].quantity)
      ) {
        message = `Dish ${i} must have a quantity that is an integer greater than 0`;
      }
    }
  }
  if (message) {
    return next({
      status: 400,
      message: message,
    });
  }

  next();
}

// Validates matching id and status --
function validateStatus(req, res, next) {
  const { orderId } = req.params;
  const { data: { id, status } = {} } = req.body;

  let message;
  if (id && id !== orderId)
    message = `Order id does not match route id. Order: ${id}, Route: ${orderId}`;
  else if (
    !status ||
    status === "" ||
    (status !== "pending" &&
      status !== "preparing" &&
      status !== "out-for-delivery")
  )
    message =
      "Order must have a status of pending, preparing, out-for-delivery, delivered";
  else if (status === "delivered")
    message = "A delivered order cannot be changed";

  if (message) {
    return next({
      status: 400,
      message: message,
    });
  }

  next();
}

// Updates Existing Order --
function updateOrder(req, res) {
  const { data: { deliverTo, mobileNumber, dishes, status } = {} } = req.body;

  res.locals.order = {
    id: res.locals.order.id,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    dishes: dishes,
    status: status,
  };

  res.json({ data: res.locals.order });
}

// Checks if an order is pending
function checkForOrderPending(req, res, next) {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

// Deletes selected/specific Order --
function destroy(req, res, next) {
  const orderToDelete = orders.indexOf(res.locals.order);
  orders.splice(orderToDelete, 1);

  res.sendStatus(204);
}

module.exports = {
  list,
  create: [validateOrderData, create],
  read: [doesOrderExist, read],
  update: [doesOrderExist, validateOrderData, validateStatus, updateOrder],
  delete: [doesOrderExist, checkForOrderPending, destroy],
};
