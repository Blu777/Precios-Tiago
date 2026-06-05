import sqlite3
import collections

conn = sqlite3.connect('miraprecios.db')
c = conn.cursor()

c.execute("SELECT nombre_estandarizado, categoria_id FROM ProductoMaestro WHERE categoria_id IS NULL OR categoria_id = 'otros' OR categoria_id = ''")
uncategorized = c.fetchall()

print(f"Total uncategorized: {len(uncategorized)}")

words = collections.Counter()
for row in uncategorized:
    name = row[0]
    if name:
        for word in name.lower().split():
            # filter out small words and numbers
            if len(word) > 3 and not any(char.isdigit() for char in word):
                words[word] += 1

print("Most common words in uncategorized products:")
for word, count in words.most_common(50):
    print(f"{word}: {count}")

conn.close()
