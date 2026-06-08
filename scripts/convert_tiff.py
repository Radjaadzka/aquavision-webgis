"""
Convert TIFF raster ke PNG overlay untuk Leaflet
Jalankan: python convert_tiff.py
"""

from osgeo import gdal, osr  # type: ignore[import-untyped]
import numpy as np  # type: ignore[import-untyped]
from PIL import Image

gdal.UseExceptions()

TIFF_PATH = "static/data/Debit.tif"
PNG_PATH = "static/data/Debit.png"

# Open TIFF
ds = gdal.Open(TIFF_PATH)
band = ds.GetRasterBand(1)
data = band.ReadAsArray()

# Get bounds in UTM
gt = ds.GetGeoTransform()
x_min = gt[0]
y_max = gt[3]
x_max = x_min + gt[1] * ds.RasterXSize
y_min = y_max + gt[5] * ds.RasterYSize

# Transform to WGS84
src_srs = osr.SpatialReference()
src_srs.ImportFromWkt(ds.GetProjection())
dst_srs = osr.SpatialReference()
dst_srs.ImportFromEPSG(4326)
transform = osr.CoordinateTransformation(src_srs, dst_srs)

lat_min, lon_min, _ = transform.TransformPoint(x_min, y_min)
lat_max, lon_max, _ = transform.TransformPoint(x_max, y_max)

print(f"Bounds WGS84:")
print(f"  South-West: {lon_min}, {lat_min}")
print(f"  North-East: {lon_max}, {lat_max}")

# Process raster data
nodata = band.GetNoDataValue()
valid = data.copy().astype(float)
if nodata is not None:
    valid[data == nodata] = np.nan

vmin = np.nanmin(valid)
vmax = np.nanmax(valid)
print(f"Value range: {vmin} - {vmax}")

# Normalize to 0-1
norm = (valid - vmin) / (vmax - vmin + 1e-10)

# Color gradient: biru (rendah) -> hijau -> kuning -> merah (tinggi)
r = np.zeros_like(norm)
g = np.zeros_like(norm)
b = np.zeros_like(norm)

mask = norm <= 0.25
r[mask] = 0; g[mask] = norm[mask] * 4; b[mask] = 1

mask = (norm > 0.25) & (norm <= 0.5)
r[mask] = 0; g[mask] = 1; b[mask] = 1 - (norm[mask] - 0.25) * 4

mask = (norm > 0.5) & (norm <= 0.75)
r[mask] = (norm[mask] - 0.5) * 4; g[mask] = 1; b[mask] = 0

mask = norm > 0.75
r[mask] = 1; g[mask] = 1 - (norm[mask] - 0.75) * 4; b[mask] = 0

# Alpha (transparent for nodata)
alpha = np.ones_like(norm) * 180
alpha[np.isnan(norm)] = 0

# Create RGBA image
rgba = np.stack([
    (r * 255).astype(np.uint8),
    (g * 255).astype(np.uint8),
    (b * 255).astype(np.uint8),
    alpha.astype(np.uint8),
], axis=-1)

img = Image.fromarray(rgba, "RGBA")
img.save(PNG_PATH)
print(f"PNG saved to {PNG_PATH}")
print()
print("=== COPY INI KE script.js ===")
print(f'const debitBounds = [[{lon_min}, {lat_min}], [{lon_max}, {lat_max}]];')