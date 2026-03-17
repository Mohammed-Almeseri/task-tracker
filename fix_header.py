import re

def fix_header():
    with open("public/index.html", "r", encoding="utf-8") as f:
        html = f.read()

    # The issue is there is already "Good Morning" text inside the h1, while JS also renders a "Good Morning" text, resulting in duplicate headers in the visual layout.
    html = re.sub(
        r'<h1 class="greeting-title" id="greeting-title">Good Morning</h1>\s*<p class="greeting-subtitle text-muted" id="greeting-subtitle">Let\'s make today count</p>',
        '''<h1 class="greeting-title" id="greeting-title"></h1>
                        <p class="greeting-subtitle text-muted" id="greeting-subtitle"></p>''',
        html
    )

    with open("public/index.html", "w", encoding="utf-8") as f:
        f.write(html)
    print("Header fixed.")

if __name__ == "__main__":
    fix_header()
