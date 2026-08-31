// Type shim for react-simple-maps, which ships no bundled TypeScript types.
// Declares the components used by LocationsTab with permissive props so the
// production build's type-check gate passes.
declare module 'react-simple-maps' {
  import * as React from 'react';

  export interface ComposableMapProps extends React.SVGProps<SVGSVGElement> {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    children?: React.ReactNode;
  }
  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface GeographiesProps {
    geography: string | Record<string, unknown> | unknown[];
    children: (data: { geographies: any[]; projection: any; path: any }) => React.ReactNode;
  }
  export const Geographies: React.FC<GeographiesProps>;

  export interface GeographyProps {
    geography: any;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: Record<string, React.CSSProperties>;
    [key: string]: unknown;
  }
  export const Geography: React.FC<GeographyProps>;

  export interface MarkerProps {
    coordinates: [number, number];
    onClick?: () => void;
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export const Marker: React.FC<MarkerProps>;

  export interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    minZoom?: number;
    maxZoom?: number;
    onMoveEnd?: (position: { coordinates: [number, number]; zoom: number }) => void;
    children?: React.ReactNode;
  }
  export const ZoomableGroup: React.FC<ZoomableGroupProps>;
}
