// Type shim for d3-geo (installed as a runtime dep of react-simple-maps, but its
// @types package can't be installed here without CodeArtifact auth). Declares
// only geoCentroid — the single function LocationsTab uses to place region markers.
declare module 'd3-geo' {
  // Accepts any GeoJSON Feature/Geometry; returns [longitude, latitude].
  export function geoCentroid(feature: any): [number, number];
}
