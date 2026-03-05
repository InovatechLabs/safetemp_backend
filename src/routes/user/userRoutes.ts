import { Router } from "express";
import { register, login, getMe, logout } from "../../controllers/user/userController";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/zod";
import { LoginSchema } from "../../validators/auth.validator";
import { RegisterSchema } from "../../validators/auth.validator";
import { authLimiter } from "../../middlewares/rateLimiter";

const userRouter = Router();

userRouter.post("/register", authLimiter, validate(RegisterSchema), register);
userRouter.post("/login", authLimiter, validate(LoginSchema), login);

// Utilizadas pela versão Web apenas!
userRouter.post("/logout", logout); 
userRouter.get("/me", authenticate, getMe); // Validação de sessão

export default userRouter;