"""Genera los iconos PNG de la app sin dependencias (zlib + distancias con antialiasing).
Mismo estilo que el icono de «Compras»: fondo claro, amarillo y tinta oscura."""
import math, struct, sys, zlib, os

def write_png(path, w, h, rows):
    raw = b''.join(b'\x00' + bytes(r) for r in rows)
    def chunk(t, d):
        c = struct.pack('>I', len(d)) + t + d
        return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) \
        + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)

def lerp(a, b, t): return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))
def cov(d): return max(0.0, min(1.0, 0.5 - d))

def rrect(px, py, cx, cy, hw, hh, r, ang=0.0):
    # Distancia con signo a un rectángulo redondeado (girado `ang` radianes).
    dx, dy = px - cx, py - cy
    c, s = math.cos(-ang), math.sin(-ang)
    dx, dy = dx * c - dy * s, dx * s + dy * c
    qx, qy = abs(dx) - hw + r, abs(dy) - hh + r
    return math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - r

def icon(S, path):
    rows = []
    for y in range(S):
        row = []
        for x in range(S):
            px, py = x + 0.5, y + 0.5
            col = lerp((255, 255, 255), (243, 240, 232), py / S)
            # Tarjeta de atrás, girada.
            a = cov(rrect(px, py, 0.56 * S, 0.44 * S, 0.25 * S, 0.17 * S, 0.06 * S, 0.21))
            col = lerp(col, (255, 230, 140), a)
            # Tarjeta delantera con sombra suave.
            sh = cov(rrect(px, py, 0.47 * S, 0.575 * S, 0.27 * S, 0.185 * S, 0.065 * S) / (0.03 * S) * 1.0 - 0.5)
            col = lerp(col, (200, 160, 40), 0.18 * sh)
            f = cov(rrect(px, py, 0.46 * S, 0.56 * S, 0.27 * S, 0.185 * S, 0.065 * S))
            if f:
                t = (py - 0.375 * S) / (0.37 * S)
                col = lerp(col, lerp((255, 222, 60), (255, 196, 0), max(0, min(1, t))), f)
                # Dos líneas de texto.
                l1 = rrect(px, py, 0.42 * S, 0.515 * S, 0.15 * S, 0.026 * S, 0.026 * S)
                l2 = rrect(px, py, 0.37 * S, 0.615 * S, 0.10 * S, 0.026 * S, 0.026 * S)
                col = lerp(col, (42, 32, 0), cov(min(l1, l2)) * f)
            row += [int(round(v)) for v in col]
        rows.append(row)
    write_png(path, S, S, rows)

out = sys.argv[1]
for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png')]:
    icon(size, os.path.join(out, name))
