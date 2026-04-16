/**
 * Retries a generic asynchronous function.
 * @param fn - The function to retry.
 * @param retries - Number of total retries (default: 2).
 * @param delay - Delay in ms between retries (default: 1000).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    // Only retry if we have retries left
    if (retries <= 0) {
      throw err;
    }

    // Log the retry attempt for debugging
    console.warn(`Firestore operation failed. Retrying... (${retries} attempts left)`, err);

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Recurse with decremented retry count
    return withRetry(fn, retries - 1, delay * 1.5); // Incremental backoff
  }
}
