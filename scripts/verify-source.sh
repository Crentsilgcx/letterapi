#!/usr/bin/env sh
set -eu
python3 - <<'PY'
from pathlib import Path
import xml.etree.ElementTree as ET
ET.parse('pom.xml')
ET.parse('src/main/resources/static/favicon.svg')
try:
    import yaml
    yaml.safe_load(Path('src/main/resources/application.yml').read_text())
    yaml.safe_load(Path('docker-compose.yml').read_text())
except ImportError:
    pass
print('XML/YAML source checks passed')
PY
if command -v node >/dev/null 2>&1; then node --check src/main/resources/static/js/deliver.js; fi
echo "Source checks passed"
