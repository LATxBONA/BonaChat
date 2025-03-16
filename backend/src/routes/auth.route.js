import express from "express";
import { checkAuth, login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

// đây là một cái api mà khi gọi tới nó sẽ thực hiện hành động trong đó vd http://localhost:5001/api/auth/logout thì nó sẽ hiện cái send
// router.get("/logout", (req, res) => {
//     res.send("logout route")
// });

export default router;
