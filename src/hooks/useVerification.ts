import { useState } from 'react';
import { StudentVerificationService, VerificationRequest, VerificationResult } from '../services/verificationService';

export function useVerification() {
  const [verifying, setVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const verifyStudent = async (data: VerificationRequest) => {
    setVerifying(true);
    setResult(null);
    try {
      const res = await StudentVerificationService.verifyStudent(data);
      setResult(res);
      return res;
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Student verification failed. Please check your credentials.';
      const failResult: VerificationResult = {
        success: false,
        isVerified: false,
        message: errMessage,
      };
      setResult(failResult);
      return failResult;
    } finally {
      setVerifying(false);
    }
  };

  const resetVerification = () => {
    setResult(null);
    setVerifying(false);
  };

  return {
    verifying,
    result,
    verifyStudent,
    resetVerification,
    isValidSRUEmail: StudentVerificationService.isValidSRUEmail,
  };
}
