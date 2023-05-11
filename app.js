require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// create new database
mongoose.connect(process.env.MONGOURL);  // You need to create .env file with the URL to MongoDB

// create a new schema - name: String
const itemsSchema = new mongoose.Schema({
  name: String
});

// create a new model
const Item = mongoose.model("Item", itemsSchema);

// create new documents
const itemOne = new Item({name: "Welcome to the toDoList!"});
const itemTwo = new Item({name: "Add new items pressing the + button!"});
const itemThree = new Item({name: "<= Check the box to remove!"});
const itemFour = new Item({name: "You can create a new list on the 3 dots"})

// put documents in an array
const defaultItems = [itemOne, itemTwo, itemThree, itemFour];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find({})
    .then(foundItem => {
      if (foundItem.length === 0) {
        return Item.insertMany(defaultItems);
      } else {
        return foundItem;
      }
    })
    .then(savedItem => {
      List.find({})
        .then(foundList => {
          res.render("list", {listTitle: day, newListItems: savedItem, newLists: foundList})
      })
      .catch(err => console.log(err));
    })
    .catch(err => console.log(err));

  


});

app.post("/", function(req, res){

  const day = date.getDate();

  // catch the new item input
  const itemName = req.body.newItem;

  // catch the list name
  const listName = req.body.list;

  // create a new itemr
  const newItem = new Item ({name: itemName});

  if (listName === day) {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName})
      .then((foundList) => {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/list/"+listName);
      })
      .catch(err => console.log(err))
  }

  
});

app.post("/delete", (req, res) => {
  const day = date.getDate();

  // check what item is checked
  const checkedItemID = req.body.checkbox;

  // check what is the list name
  const listName = req.body.listName;

  if (listName === day){ // if is the homepage (has the day in the title)
    Item.findByIdAndRemove(checkedItemID)
    .then(() => console.log("The item with id: " + checkedItemID + " was removed!"))
    .then(() => res.redirect("/"))
    .catch(err => console.log(err));
  } else {
    // find the list and update/delete Model.findOneAndUpdate({condition}, {pull: {field: {_id: value}}})
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}})
      .then((foundList) => res.redirect("/list/"+listName))
      .catch(err => console.log(err));
  }

  
});

app.use(express.static(__dirname + '/public'));


app.get("/list/:pageName", (req, res) => {
  const customListName =  _.capitalize(req.params.pageName);
  
  List.findOne({name: customListName})
    .then((foundList) => {
      if(!foundList) {  //if list doesn't exist
        // create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        console.log("Saved");
        res.redirect("/list/"+customListName);
      } else {
        // show an existing list
        List.find({})
        .then(foundLists => {
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items, newLists: foundLists});
        })
        .catch(err => console.log(err));
          
      }
    })
    .catch(err => console.log(err));


});

app.post("/addnewlist", (req, res) => {
  const newListName = req.body.newListName;

  res.redirect("/list/" + newListName)
});


app.listen(5500, function() {
  console.log("Server started on port 5500");
});
