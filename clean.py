import os
import re

def clean_files(directory):
    pattern = re.compile(r'\s*//\s*👈.*$|\s*/\*\s*👈.*?\*/', re.MULTILINE)
    count = 0
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content, num_subs = pattern.subn('', content)
                    
                    if num_subs > 0:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        count += 1
                        print(f"Cleaned {filepath} ({num_subs} replacements)")
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
    print(f"Total files cleaned: {count}")

clean_files('src')
