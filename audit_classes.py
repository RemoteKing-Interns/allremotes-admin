import re

# Read storefront.css and extract class names
with open('src/app/storefront.css') as f:
    css = f.read()
css_classes = set(re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*)', css))

# Read the component file
with open('src/components/storefront/storefront-admin-app.tsx') as f:
    tsx = f.read()

# Find which storefront.css classes are still referenced in the component
used = set()
for cls in css_classes:
    # Look for the class name in className strings
    if re.search(r'["\'\s]' + re.escape(cls) + r'["\'\s,)]', tsx):
        used.add(cls)

print(f'Total storefront.css classes: {len(css_classes)}')
print(f'Still referenced in component: {len(used)}')
print()
for c in sorted(used):
    print(f'  {c}')
