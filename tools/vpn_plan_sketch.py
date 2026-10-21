#!/usr/bin/env python3
"""r197: the plan sketch of the VPN episode's map (before any code), to put the story to Simon:
out/vpn-plan-map.png, two lanes (without and with the tunnel) and who sees what at each box."""
from PIL import Image, ImageDraw, ImageFont
W, H = 1400, 760
im = Image.new("RGB", (W, H), "#14161f"); d = ImageDraw.Draw(im)
F = lambda s: ImageFont.truetype("/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf", s)
B = lambda s: ImageFont.truetype("/usr/share/fonts/google-noto-vf/NotoSans[wght].ttf", s)
d.text((40, 24), "Épisode 10 « Le tunnel » — plan sketch of the map (r197), not a render", font=B(26), fill="#ffc24d")
boxes = [("Café\nAlice's laptop", 90), ("Café Wi-Fi\nEve listens", 360), ("ISP", 630), ("VPN server\n(another town)", 900), ("Bob's site", 1170)]
def lane(y, title, tunnel, seen):
    d.text((40, y - 70), title, font=B(22), fill="#e6dfcf")
    d.line((260, y + 45, 1170, y + 45), fill="#9fd0ff", width=4)   # under the boxes
    if tunnel: d.rounded_rectangle((75, y - 12, 1085, y + 102), 22, outline="#ffc24d", width=4)
    for k, (name, x) in enumerate(boxes):
        if name.startswith("VPN") and not tunnel: continue   # no VPN in this lane: the cable goes straight on
        col = "#2c5d8a" if k in (0, 4) else "#4a4f63"
        d.rounded_rectangle((x, y, x + 170, y + 90), 14, fill=col, outline="#888", width=2)
        d.multiline_text((x + 85, y + 45), name, font=F(17), fill="#fff", anchor="mm", align="center")
        d.multiline_text((x + 85, y + 112), seen[k], font=F(14), fill="#d9d2c0", anchor="ma", align="center")
    if tunnel:
        d.text((420, y - 40), "WireGuard tunnel: X25519 + ChaCha20-Poly1305", font=F(16), fill="#ffc24d")
lane(170, "Without the tunnel (HTTPS on)", False,
     ["sends", "sees: Alice -> Bob's address,\nthe site's name (DNS, TLS hello),\nsizes, times", "sees the same", "", "sees Alice's address"])
lane(480, "With the tunnel", True,
     ["seals every packet,\nBob's address inside", "sees: Alice -> VPN server,\nsizes, times. Not the site", "sees the same", "opens the tunnel: sees what\nthe ISP used to see\n(the trust moves)", "sees the VPN server's address,\nnot Alice's"])
d.text((40, 712), "Envelopes ride the cables; the address is written on the outside. Flip one byte inside the tunnel: the VPN server throws the packet away.", font=F(16), fill="#aaa")
im.save("out/vpn-plan-map.png"); print("out/vpn-plan-map.png")
