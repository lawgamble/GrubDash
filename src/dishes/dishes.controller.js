const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Create, Read, Update, List

function list(req, res, next) {
  res.json({ data: dishes });
}

// Creates dish object - giving it a new id and pushes in to dishes array --
function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newId = nextId();

  const newDish = {
    id: newId,
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// Checks all data in body --
function bodyDataChecker(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const stringContents = /[a-z]/i;
  let message;

  if (!name || typeof name !== "string" || !stringContents.test(name)) {
    message = `A Dish must include a name`;
  } else if (
    !description ||
    typeof description !== "string" ||
    !stringContents.test(description)
  ) {
    message = `Dish must include a description`;
  } else if (!price) {
    message = `Dish must include a price`;
  } else if (typeof price !== "number" || price <= 0) {
    message = `Dish must have a price that is an integer greater than 0`;
  } else if (
    !image_url ||
    typeof image_url !== "string" ||
    !stringContents.test(image_url)
  ) {
    message = `Dish must include a image_url`;
  }
  if (message) {
    return next({
      status: 400,
      message: message,
    });
  }
  next();
}

function doesDishExist(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: "No matching dish found.",
  });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
  next();
}

function update(req, res, next) {
  const { dishId } = req.params;
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  foundDish.id = res.locals.dishId;
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.status(200).json({ data: foundDish });
}

// Only runs next() if dishId is not present or if it is, they must be exact match --
function validateDishBodyId(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  if (!id || id === dishId) {
    res.locals.dishId = dishId;
    return next();
  }

  next({
    status: 400,
    message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
  });
}

// Specific func for PUT/ Updating -- checks to see if dishId exists --
function validateDishId(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }

  next({
    status: 404,
    message: `Dish id does not exist: ${dishId}`,
  });
}

module.exports = {
  list,
  create: [bodyDataChecker, create],
  read: [doesDishExist, read],
  update: [validateDishId, bodyDataChecker, validateDishBodyId, update],
};
