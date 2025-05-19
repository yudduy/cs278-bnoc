/**
 * @deprecated This file is deprecated. Import useAuth directly from '../context/AuthContext' instead.
 * This file remains only for backward compatibility and will be removed in a future release.
 */

import { useAuth as importedUseAuth } from '../context/AuthContext';

// Re-export the hook from the context for backward compatibility
export const useAuth = importedUseAuth;
