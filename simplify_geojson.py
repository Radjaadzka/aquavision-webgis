"""
Simplify DebitPuncak GeoJSON files using Ramer-Douglas-Peucker algorithm.
Reduces file size from ~5-7 MB to < 1 MB by removing redundant collinear
vertices in raster-derived polygon boundaries.
"""
import json, os, time

TOLERANCE = 0.00005   # ~5m in decimal degrees — aman untuk zoom 14
DATA_DIR  = os.path.join(os.path.dirname(__file__), "static", "data")
PRECISION = 6         # decimal places kept (0.000001 deg ≈ 0.1 m)


def pt_line_dist(p, a, b):
    """Distance from point p to line segment a-b."""
    ax, ay = a; bx, by = b; px, py = p
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)
    t = max(0.0, min(1.0, t))
    return ((px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2) ** 0.5


def rdp(pts, eps):
    """Ramer-Douglas-Peucker simplification."""
    if len(pts) < 3:
        return pts
    d_max, idx = 0, 0
    end = len(pts) - 1
    for i in range(1, end):
        d = pt_line_dist(pts[i], pts[0], pts[end])
        if d > d_max:
            idx, d_max = i, d
    if d_max > eps:
        return rdp(pts[:idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[end]]


def simplify_ring(ring, eps):
    """Simplify one polygon ring; guarantee at least 4 pts (closed)."""
    if len(ring) < 4:
        return ring
    pts = [(p[0], p[1]) for p in ring]
    # Close ring: last == first; rdp keeps only endpoints so add first back
    result = rdp(pts[:-1], eps)
    if len(result) < 3:
        return ring          # fallback: don't simplify degenerate ring
    result.append(result[0])
    return [[round(p[0], PRECISION), round(p[1], PRECISION)] for p in result]


def simplify_coords(geom_type, coords, eps):
    """Recursively simplify coordinates based on geometry type."""
    if geom_type == "Polygon":
        return [simplify_ring(ring, eps) for ring in coords]
    if geom_type == "MultiPolygon":
        return [[simplify_ring(ring, eps) for ring in poly] for poly in coords]
    if geom_type in ("LineString", "MultiPoint"):
        return [[round(p[0], PRECISION), round(p[1], PRECISION)] for p in coords]
    if geom_type == "MultiLineString":
        return [[[round(p[0], PRECISION), round(p[1], PRECISION)] for p in line] for line in coords]
    # Point / unknown
    return coords


def simplify_file(path, eps):
    t0 = time.time()
    sz_before = os.path.getsize(path) / 1024
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for feat in data.get("features", []):
        geom = feat.get("geometry")
        if not geom or "coordinates" not in geom:
            continue
        geom["coordinates"] = simplify_coords(geom["type"], geom["coordinates"], eps)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, separators=(",", ":"))

    sz_after = os.path.getsize(path) / 1024
    elapsed  = time.time() - t0
    saving   = sz_before - sz_after
    pct      = saving / sz_before * 100
    print(f"  {os.path.basename(path):35s}  "
          f"{sz_before:7.0f} KB -> {sz_after:7.0f} KB  "
          f"(-{saving:.0f} KB, -{pct:.0f}%)  [{elapsed:.1f}s]")
    return sz_after


if __name__ == "__main__":
    files = sorted([
        os.path.join(DATA_DIR, f)
        for f in os.listdir(DATA_DIR)
        if f.startswith("DebitPuncak_") and f.endswith(".geojson")
    ])
    if not files:
        print("No DebitPuncak_*.geojson files found in", DATA_DIR)
    else:
        print(f"Simplifying {len(files)} files with tolerance={TOLERANCE}°...\n")
        total_before = total_after = 0
        for fp in files:
            before = os.path.getsize(fp) / 1024
            after  = simplify_file(fp, TOLERANCE)
            total_before += before
            total_after  += after
        print(f"\nTotal: {total_before:.0f} KB -> {total_after:.0f} KB "
              f"(-{total_before - total_after:.0f} KB, "
              f"-{(total_before - total_after)/total_before*100:.0f}%)")
