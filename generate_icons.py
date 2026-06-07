import os
import subprocess
from PIL import Image

# 1. Define paths
PUBLIC_DIR = "public"
APP_DIR = "src/app"

SVG_CONTENT = """<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="-105 -105 210 210">
  <defs>
    <!-- Premium soft gradient for white hexagons -->
    <radialGradient id="hexGrad" cx="-20" cy="-20" r="140" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </radialGradient>

    <!-- Vibrant celeste (sky blue) gradient for pentagons -->
    <radialGradient id="pentGrad" cx="-20" cy="-20" r="130" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#E0F2FE" />
      <stop offset="50%" stop-color="#7DD3FC" />
      <stop offset="100%" stop-color="#0284C7" />
    </radialGradient>

    <!-- Cool-toned navy spherical shadow for realistic 3D volume without muddying colors -->
    <radialGradient id="sphereShade" cx="-30" cy="-30" r="130" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.4" />
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0.0" />
      <stop offset="80%" stop-color="#1E3A8A" stop-opacity="0.08" />
      <stop offset="95%" stop-color="#0F172A" stop-opacity="0.20" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0.38" />
    </radialGradient>

    <clipPath id="ballClip">
      <circle r="100" />
    </clipPath>
  </defs>

  <!-- Outer soft glow/shadow for high visibility on all backgrounds (dark and light) -->
  <circle r="102" fill="none" stroke="#0F172A" stroke-width="3" stroke-opacity="0.05" />
  <circle r="101" fill="none" stroke="#0F172A" stroke-width="1.5" stroke-opacity="0.10" />

  <!-- Ball Base (Hexagons) -->
  <circle r="100" fill="url(#hexGrad)" />

  <!-- Clipped contents (Pentagons and Seams) -->
  <g clip-path="url(#ballClip)">
    <!-- Pentagons -->
    <path fill="url(#pentGrad)" d="M6-32q20 4 40 13 11-16 18-28-14-21-27-29-20 1-36 8 3 17 5 36M-26-2q-19-6-36-9-12 16-14 33 7 18 26 32 18-7 33-15-6-24-9-41m-69 24q-7-10-7-30v88h17q-10-35-10-58m150 2Q41 41 24 52q4 13 7 27 24-1 37-12 10-17 12-32-15-7-25-11M0 120l-3-25q-22-2-39-13-8 2-18-1M-90-48q10-4 22-1 16-22 33-28 0-23-5-23h-60m200 45L87-37Q98-10 97 5l3 1" />
    
    <!-- Seam Lines - crisp dark slate for professional contrast -->
    <path fill="none" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" d="M6-32q20 4 40 13 11-16 18-28-14-21-27-29-20 1-36 8 3 17 5 36M-26-2q-19-6-36-9-12 16-14 33 7 18 26 32 18-7 33-15-6-24-9-41m-69 24q-7-10-7-30v88h17q-10-35-10-58m150 2Q41 41 24 52q4 13 7 27 24-1 37-12 10-17 12-32-15-7-25-11M0 120l-3-25q-22-2-39-13-8 2-18-1M-90-48q10-4 22-1 16-22 33-28 0-23-5-23h-60m200 45L87-37Q98-10 97 5l3 1" />
    <path fill="none" stroke="#1E293B" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" d="M6-32Q-18-12-26-2m72-17q8 24 9 43m9-71q13 3 23 10M37-76q2-14-1-24M1-68q-14-9-36-9m-27 66q-5-14-6-38m-8 71q-9 2-19 0m45 32q1 16 8 28m25-43q17 9 41 13m7 27Q20 92-3 95m71-28 12 13m0-45Q90 25 97 5" />
  </g>

  <!-- Spherical shadow overlay for 3D depth -->
  <circle r="100" fill="url(#sphereShade)" pointer-events="none" />

  <!-- Outermost sharp border for high scaling clarity -->
  <circle r="100" fill="none" stroke="#1E293B" stroke-width="2.5" />
</svg>
"""

def main():
    print("Writing SVG files...")
    # 2. Write SVG files
    svg_pub_path = os.path.join(PUBLIC_DIR, "favicon.svg")
    svg_app_path = os.path.join(APP_DIR, "icon.svg")
    
    with open(svg_pub_path, "w") as f:
        f.write(SVG_CONTENT)
    with open(svg_app_path, "w") as f:
        f.write(SVG_CONTENT)

    print("Generating PNG sizes using sips...")
    # 3. Use sips to generate the different sizes
    sizes = {
        "icon-16.png": 16,
        "icon-32.png": 32,
        "icon-48.png": 48,
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }
    
    for filename, size in sizes.items():
        out_path = os.path.join(PUBLIC_DIR, filename)
        cmd = ["sips", "-s", "format", "png", "-z", str(size), str(size), svg_pub_path, "--out", out_path]
        subprocess.run(cmd, check=True)
        print(f"Generated {out_path} ({size}x{size})")

    # Copy apple-touch-icon.png to app dir as apple-icon.png
    apple_src = os.path.join(PUBLIC_DIR, "apple-touch-icon.png")
    apple_dest = os.path.join(APP_DIR, "apple-icon.png")
    subprocess.run(["cp", apple_src, apple_dest], check=True)
    print(f"Copied apple touch icon to {apple_dest}")

    # 4. Use Pillow to compile the multi-resolution ICO file
    print("Compiling ICO files using Pillow...")
    img16 = Image.open(os.path.join(PUBLIC_DIR, "icon-16.png"))
    img32 = Image.open(os.path.join(PUBLIC_DIR, "icon-32.png"))
    img48 = Image.open(os.path.join(PUBLIC_DIR, "icon-48.png"))
    
    # Save favicon.ico to both public/ and src/app/
    ico_pub_path = os.path.join(PUBLIC_DIR, "favicon.ico")
    ico_app_path = os.path.join(APP_DIR, "favicon.ico")
    
    # Write multi-resolution ICO (sizes: 16x16, 32x32, 48x48)
    img32.save(ico_pub_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    img32.save(ico_app_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Generated multi-resolution ICO at {ico_pub_path} and {ico_app_path}")

    # 5. Clean up temporary PNGs in public/
    print("Cleaning up temporary files...")
    temp_files = ["icon-16.png", "icon-32.png", "icon-48.png", "icon-test.svg", "icon-test.png"]
    for temp in temp_files:
        p = os.path.join(PUBLIC_DIR, temp)
        if os.path.exists(p):
            os.remove(p)
            print(f"Removed temporary file: {p}")

    print("Success! All icon files generated successfully.")

if __name__ == "__main__":
    main()
