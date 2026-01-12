#!/bin/bash

# Show the full ancestry tree for a given ISO 639-3 code
# Usage: ./show-ancestry.sh <iso_code>

CSV_FILE="$(dirname "$0")/public/languages.csv"

if [ -z "$1" ]; then
    echo "Usage: $0 <iso_code>"
    echo "Example: $0 deu  (German)"
    exit 1
fi

ISO_CODE="$1"

# Find the language by ISO code
LANG_LINE=$(awk -F',' -v iso="$ISO_CODE" '$3 == iso {print; exit}' "$CSV_FILE" | tr -d '\r')

if [ -z "$LANG_LINE" ]; then
    echo "Language with ISO code '$ISO_CODE' not found."
    exit 1
fi

# Extract fields from the initial language
ID=$(echo "$LANG_LINE" | cut -d',' -f1)
NAME=$(echo "$LANG_LINE" | cut -d',' -f2)
LEVEL=$(echo "$LANG_LINE" | cut -d',' -f4)
PARENT_ID=$(echo "$LANG_LINE" | cut -d',' -f5 | tr -d '[:space:]')

echo "Ancestry for: $NAME ($ISO_CODE)"
echo "================================================"
echo ""

# Build array of ancestors
declare -a ANCESTORS
ANCESTORS+=("$NAME ($ID, $LEVEL)")

# Walk up the parent chain
CURRENT_PARENT="$PARENT_ID"
while [ -n "$CURRENT_PARENT" ]; do
    # Find parent by ID
    PARENT_LINE=$(awk -F',' -v id="$CURRENT_PARENT" '$1 == id {print; exit}' "$CSV_FILE" | tr -d '\r')

    if [ -z "$PARENT_LINE" ]; then
        break
    fi

    P_ID=$(echo "$PARENT_LINE" | cut -d',' -f1)
    P_NAME=$(echo "$PARENT_LINE" | cut -d',' -f2)
    P_LEVEL=$(echo "$PARENT_LINE" | cut -d',' -f4)
    CURRENT_PARENT=$(echo "$PARENT_LINE" | cut -d',' -f5 | tr -d '[:space:]')

    ANCESTORS+=("$P_NAME ($P_ID, $P_LEVEL)")
done

# Print from root to language (reverse order)
TOTAL=${#ANCESTORS[@]}
for ((i=TOTAL-1; i>=0; i--)); do
    DEPTH=$((TOTAL - 1 - i))
    INDENT=$(printf '%*s' $((DEPTH * 2)) '')
    if [ $i -eq 0 ]; then
        echo "${INDENT}└── ${ANCESTORS[$i]} ← $ISO_CODE"
    else
        echo "${INDENT}└── ${ANCESTORS[$i]}"
    fi
done

echo ""
echo "Total levels: $TOTAL"
