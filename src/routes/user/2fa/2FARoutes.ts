import { Router } from 'express';
import { enable2FA, verify2FA, verifyLoginCode, verifyBackupCode, disable2FA, getBackupCode } from '../../../controllers/user/2fa/2FAController';
import { authenticate } from '../../../middlewares/auth';

const TwoFARouter = Router();

TwoFARouter.post("/enable-2fa", authenticate, enable2FA);
TwoFARouter.post("/verify-2fa", authenticate, verify2FA);
TwoFARouter.post("/verify-login-code", verifyLoginCode);
TwoFARouter.post("/verify-backup-code", verifyBackupCode);
TwoFARouter.patch("/disable-2fa", authenticate, disable2FA);
TwoFARouter.get("/get-backup-code", authenticate, getBackupCode);

export default TwoFARouter;