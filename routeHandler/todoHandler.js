const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const todoSchema = require("../schemas/todoSchema");
const userSchema = require("../schemas/userSchema");
const Todo = new mongoose.model("Todo", todoSchema);
const User = new mongoose.model("User", userSchema);
const checkLogin = require("../middlewares/checkLogin");

// GET ALL THE TODOS
router.get("/", checkLogin, (req, res) => {
  Todo.find({})
    .populate("user", "name username -_id")
    .select({
      _id: 0,
      __v: 0,
      date: 0,
    })
    .limit(2)
    .exec()
    .then((data) => {
      res.status(200).json({
        result: data,
        message: "Success",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: "There was a server side error!",
      });
    });
});

// // // GET ALL THE TODOS

// router.get("/", checkLogin, async (req, res) => {
//   try {
//     console.log(req.username);
//     console.log(req.userId);

//     const data = await Todo.find({ status: "active" })
//       .select({
//         _id: 0,
//         __v: 0,
//         date: 0,
//       })
//       .limit(2)
//       .exec();

//     res.status(200).json({
//       result: data,
//       message: "Success",
//     });
//   } catch (err) {
//     res.status(500).json({
//       error: "There was a server side error!",
//     });
//   }
// });

// GET ACTIVE TODOS AND THIS IS ALTERNATIVE OF callback
router.get("/active", async (req, res) => {
  const todo = new Todo();
  const data = await todo.findActive();
  res.status(200).json({
    data,
  });
});

// GET ACTIVE TODOS with callback
router.get("/active-callback", (req, res) => {
  const todo = new Todo();
  todo.findActiveCallback((err, data) => {
    res.status(200).json({
      data,
    });
  });
});

// GET ACTIVE TODOS
router.get("/js", async (req, res) => {
  const data = await Todo.find();
  res.status(200).json({
    data,
  });
});

// GET TODOS BY LANGUAGE
router.get("/language", async (req, res) => {
  const data = await Todo.find().byLanguage("mongoose");
  res.status(200).json({
    data,
  });
});

// GET A TODO by ID
router.get("/:id", async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.status(200).json({
      result: todo,
      message: "Success",
    });
  } catch (err) {
    res.status(500).json({
      error: "There was a server side error!",
    });
  }
});

// POST A TODO
router.post("/", checkLogin, async (req, res) => {
  const newTodo = new Todo({
    ...req.body,
    user: req.userId,
  });

  try {
    const todo = await newTodo.save();
    await User.updateOne(
      {
        _id: req.userId,
      },
      {
        $push: {
          todos: todo._id,
        },
      }
    );

    res.status(200).json({
      message: "Todo was inserted successfully!",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: "There was a server side error!",
    });
  }
});

// POST MULTIPLE TODO
router.post("/all", async (req, res) => {
  try {
    await Todo.insertMany(req.body);
    res.status(200).json({
      message: "Todos were inserted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      error: "There was a server side error!",
    });
  }
});

// PUT TODO
router.put("/:id", async (req, res) => {
  try {
    const result = await Todo.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "active" } },
      { new: true, useFindAndModify: false }
    );
    res.status(200).json({
      message: "Todo was updated successfully!",
    });
  } catch (err) {
    res.status(500).json({
      error: "There was a server side error!",
    });
  }
});

// DELETE TODO
router.delete("/:id", async (req, res) => {
  try {
    const result = await Todo.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.status(200).json({
      message: "Todo was deleted successfully!",
    });
  } catch (err) {
    res.status(500).json({
      error: "There was a server side error!",
    });
  }
});

module.exports = router;
