import requests
from bs4 import BeautifulSoup

# URL of your "Active Bids" page
URL = "https://bidbelowretail.com/Account/Bidding/Active"

# Path where we'll write our GitHub Pages–friendly HTML
OUT_PATH = "docs/index.html"

def fetch_listings(url):
    r = requests.get(url)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")

    listings = []
    for card in soup.find_all(attrs={"data-listingid": True}):
        lid = card["data-listingid"]
        title_el = card.select_one(".bid-conf-title")
        curr_el  = card.select_one(".awe-rt-CurrentPrice .NumberPart")
        min_el   = card.select_one(".awe-rt-MinimumBid .NumberPart")
        max_el   = card.select_one(".awe-rt-MaxBid .NumberPart")
        status_el = card.select_one(".awe-rt-CurrentPrice")
        status = "Winning" if "winning" in status_el.get("class", []) else "Outbid"

        listings.append({
            "id":    lid,
            "title": title_el.get_text(strip=True) if title_el else "",
            "current_price": curr_el.get_text(strip=True) if curr_el else "",
            "min_bid":       min_el.get_text(strip=True) if min_el else "",
            "max_bid":       max_el.get_text(strip=True) if max_el else "",
            "status": status
        })
    return listings

def build_html(listings, out_file=OUT_PATH):
    html = [
        "<!DOCTYPE html>",
        "<html><head><meta charset='utf-8'><title>Bid Monitor</title>",
        "<meta http-equiv='refresh' content='300'>",
        "<style>table{border-collapse:collapse;}td,th{border:1px solid #444;padding:4px;}</style>",
        "</head><body>",
        "<h1>My Active Bids</h1>",
        "<table>",
        "<tr><th>ID</th><th>Title</th><th>Current</th><th>Min Bid</th><th>Max Bid</th><th>Status</th></tr>"
    ]
    for l in listings:
        html.append(
            "<tr>" +
            f"<td>{l['id']}</td>" +
            f"<td>{l['title']}</td>" +
            f"<td>{l['current_price']}</td>" +
            f"<td>{l['min_bid']}</td>" +
            f"<td>{l['max_bid']}</td>" +
            f"<td>{l['status']}</td>" +
            "</tr>"
        )
    html.extend(["</table>", "</body></html>"])

    import os
    os.makedirs(os.path.dirname(out_file), exist_ok=True)

    with open(out_file, "w", encoding="utf-8") as f:
        f.write("\n".join(html))
    print(f"Wrote monitor to {out_file}")

if __name__ == "__main__":
    data = fetch_listings(URL)
    build_html(data)
