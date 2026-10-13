'use client';

import { createContext, useContext } from 'react';

// True inside the /demo-dashboard preview. Shared components read it to show the
// preview's trimmed-down version (e.g. the device detail page) without threading a
// prop through every caller. The main app at / never sets it.
export const PreviewModeContext = createContext(false);
export const usePreviewMode = () => useContext(PreviewModeContext);
