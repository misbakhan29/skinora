import os
import json

PUBLIC_DIR = r"c:\Users\H P\OneDrive\Desktop\skinora\frontend\public\images\products"
os.makedirs(PUBLIC_DIR, exist_ok=True)

PRODUCTS_FILE = r"c:\Users\H P\OneDrive\Desktop\skinora\backend\data\products.json"

with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
    products = json.load(f)

# Styles based on step category and brand colors
BRAND_COLORS = {
    "CeraVe": {"primary": "#005696", "bg": "#EBF4FA", "accent": "#00A8B5"},
    "The Minimalist": {"primary": "#1A1A1A", "bg": "#F5F5F7", "accent": "#333333"},
    "Minimalist": {"primary": "#1A1A1A", "bg": "#F5F5F7", "accent": "#333333"},
    "Simple": {"primary": "#00875A", "bg": "#E6F4EA", "accent": "#42B883"},
    "Plum": {"primary": "#5C2D91", "bg": "#F3E8FF", "accent": "#8E44AD"},
    "Dot & Key": {"primary": "#FF5A79", "bg": "#FFF0F3", "accent": "#FF85A1"},
    "Re'equil": {"primary": "#0072CE", "bg": "#E8F4FD", "accent": "#00A3E0"},
    "COSRX": {"primary": "#D9381E", "bg": "#FDF2F0", "accent": "#FF6B4A"},
    "WOW Skin Science": {"primary": "#2D6A4F", "bg": "#E8F5E9", "accent": "#52B788"},
    "Lakme": {"primary": "#8E1616", "bg": "#FDEDEC", "accent": "#D98880"},
    "Sebamed": {"primary": "#0055A5", "bg": "#E3F2FD", "accent": "#E53935"},
}

def generate_product_svg(p):
    pid = p["id"]
    brand = p.get("brand", "Skincare")
    name = p.get("name", "Product")
    category = p.get("step_category", "serum").lower()
    
    brand_style = BRAND_COLORS.get(brand, {"primary": "#D946EF", "bg": "#FDF2F8", "accent": "#EC4899"})
    p_col = brand_style["primary"]
    bg_col = brand_style["bg"]
    acc_col = brand_style["accent"]
    
    # Choose bottle type
    if category == "cleanser":
        # Pump Bottle
        bottle_path = """
        <!-- Pump Head -->
        <rect x="90" y="32" width="20" height="8" rx="2" fill="#E2E8F0" />
        <rect x="97" y="40" width="6" height="15" fill="#CBD5E1" />
        <rect x="75" y="24" width="35" height="10" rx="3" fill="#E2E8F0" />
        <rect x="70" y="27" width="10" height="4" rx="1" fill="#94A3B8" />
        <!-- Bottle Neck -->
        <rect x="86" y="55" width="28" height="15" rx="3" fill="{p_col}" />
        <!-- Bottle Body -->
        <rect x="62" y="70" width="76" height="130" rx="16" fill="white" stroke="{p_col}" stroke-width="3" />
        <rect x="68" y="76" width="64" height="118" rx="12" fill="{bg_col}" opacity="0.4" />
        <!-- Label -->
        <rect x="70" y="90" width="60" height="90" rx="6" fill="white" stroke="#E2E8F0" stroke-width="1.5" />
        <rect x="76" y="98" width="48" height="4" rx="2" fill="{p_col}" />
        """
    elif category == "toner":
        # Tall Cylinder Bottle
        bottle_path = """
        <!-- Cap -->
        <rect x="80" y="25" width="40" height="35" rx="4" fill="{p_col}" />
        <!-- Bottle Body -->
        <rect x="70" y="60" width="60" height="145" rx="12" fill="white" stroke="{p_col}" stroke-width="3" />
        <rect x="75" y="65" width="50" height="135" rx="8" fill="{bg_col}" opacity="0.5" />
        <!-- Label -->
        <rect x="75" y="95" width="50" height="85" rx="4" fill="white" stroke="#E2E8F0" stroke-width="1.5" />
        <rect x="80" y="103" width="40" height="3" rx="1.5" fill="{p_col}" />
        """
    elif category == "serum":
        # Dropper Bottle
        bottle_path = """
        <!-- Dropper Top -->
        <path d="M 94 20 Q 100 15 106 20 L 106 32 L 94 32 Z" fill="#334155" />
        <rect x="88" y="32" width="24" height="16" rx="4" fill="{p_col}" />
        <rect x="96" y="48" width="8" height="15" fill="#E2E8F0" />
        <!-- Bottle Neck -->
        <rect x="84" y="63" width="32" height="12" rx="3" fill="#CBD5E1" />
        <!-- Glass Bottle Body -->
        <rect x="68" y="75" width="64" height="115" rx="14" fill="white" stroke="{p_col}" stroke-width="3" />
        <rect x="73" y="80" width="54" height="105" rx="10" fill="{bg_col}" opacity="0.6" />
        <!-- Label -->
        <rect x="74" y="100" width="52" height="75" rx="4" fill="white" stroke="#E2E8F0" fill-opacity="0.95" />
        <rect x="80" y="108" width="40" height="3" rx="1" fill="{p_col}" />
        """
    elif category == "moisturizer":
        # Jar or Soft Cream Tube
        bottle_path = """
        <!-- Lid -->
        <rect x="62" y="65" width="76" height="25" rx="6" fill="{p_col}" />
        <!-- Jar Body -->
        <rect x="58" y="90" width="84" height="95" rx="16" fill="white" stroke="{p_col}" stroke-width="3" />
        <rect x="64" y="95" width="72" height="85" rx="12" fill="{bg_col}" opacity="0.5" />
        <!-- Label -->
        <rect x="68" y="110" width="64" height="55" rx="6" fill="white" stroke="#E2E8F0" stroke-width="1.5" />
        <rect x="74" y="118" width="52" height="4" rx="2" fill="{acc_col}" />
        """
    else: # Sunscreen / Tube
        bottle_path = """
        <!-- Tube Crimped Top -->
        <rect x="75" y="25" width="50" height="8" rx="2" fill="{p_col}" />
        <!-- Tube Body -->
        <path d="M 75 33 L 125 33 L 132 155 Q 100 170 68 155 Z" fill="white" stroke="{p_col}" stroke-width="3" />
        <path d="M 78 38 L 122 38 L 128 150 Q 100 162 72 150 Z" fill="{bg_col}" opacity="0.5" />
        <!-- Cap -->
        <rect x="78" y="160" width="44" height="30" rx="6" fill="{p_col}" />
        <!-- Label -->
        <rect x="76" y="60" width="48" height="75" rx="4" fill="white" stroke="#E2E8F0" />
        <circle cx="100" cy="88" r="14" fill="{bg_col}" stroke="{acc_col}" stroke-width="1.5" />
        <text x="100" y="92" font-size="9" font-weight="bold" fill="{acc_col}" text-anchor="middle">SPF</text>
        """

    # Escape brand & name for SVG text display
    short_brand = brand[:15].upper()
    short_name = name[:18]
    if len(name) > 18:
        short_name = name[:16] + ".."

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" fill="none">
  <!-- Background -->
  <rect width="200" height="220" rx="16" fill="#FFFFFF"/>
  <circle cx="100" cy="120" r="75" fill="{bg_col}" opacity="0.4"/>
  
  {bottle_path.format(p_col=p_col, bg_col=bg_col, acc_col=acc_col)}

  <!-- Brand & Product Text on Bottle Label -->
  <text x="100" y="130" font-family="sans-serif" font-size="7" font-weight="bold" fill="{p_col}" text-anchor="middle" letter-spacing="0.5">{short_brand}</text>
  <text x="100" y="142" font-family="sans-serif" font-size="6" font-weight="600" fill="#334155" text-anchor="middle">{short_name}</text>
  <text x="100" y="152" font-family="sans-serif" font-size="5" fill="#64748B" text-anchor="middle">{category.upper()}</text>
</svg>"""

    file_path = os.path.join(PUBLIC_DIR, f"{pid}.svg")
    with open(file_path, "w", encoding="utf-8") as f_out:
        f_out.write(svg_content)
    
    # Return local relative URL
    return f"/images/products/{pid}.svg"

updated_count = 0
for p in products:
    img_url = generate_product_svg(p)
    p["image_url"] = img_url
    updated_count += 1

with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
    json.dump(products, f, indent=2, ensure_ascii=False)

print(f"Successfully generated {updated_count} local SVG product image assets in frontend/public/images/products/")
