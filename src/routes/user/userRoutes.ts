import { Router } from "express";
import { register, login, getMe, logout } from "../../controllers/user/userController";
import { authenticate } from "../../middlewares/auth";

const userRouter = Router();

userRouter.post("/register", register);
userRouter.post("/login", login);

// Utilizadas pela versão Web apenas!
userRouter.post("/logout", logout); 
userRouter.get("/me", authenticate, getMe); // Validação de sessão

export default userRouter;