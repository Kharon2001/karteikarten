// Tarjetas iniciales (T-Kurs, Studienkolleg). Solo se usan la primera vez que se abre la app.
// Formato: [Vorderseite, Rückseite]. Fórmulas entre $…$ (en línea) o $$…$$ (centradas),
// **negrita** y saltos de línea con \n.

const r = String.raw;

export const SEED_DECKS = [
  {
    name: 'Mathematik',
    emoji: '📐',
    cards: [
      [r`Was bedeutet $A \cap B$, $A \cup B$ und $A \setminus B$?`,
        r`$A \cap B$: in A **und** in B (Schnittmenge)
$A \cup B$: in A **oder** in B (Vereinigung)
$A \setminus B$: in A, aber **nicht** in B (A ohne B)`],
      [r`$A = \{x \in \mathbb{N} \mid x < 8\}$, $B = \{x \in \mathbb{N} \mid x \text{ gerade}\}$.
Bestimmen Sie $A \cap B$ und $A \setminus B$.`,
        r`$A \cap B = \{2;4;6\}$
$A \setminus B = \{1;3;5;7\}$
(In der Musterlösung zählt 0 nicht zu $\mathbb{N}$.)`],
      [r`Wann ist die Implikation $a \to b$ falsch? Welcher Term ist äquivalent?`,
        r`Nur bei **w → f** (a wahr, b falsch).
$$a \to b \equiv \neg a \lor b$$`],
      [r`Übersetzen Sie in einen Aussageterm: „weder a noch b“.`,
        r`$$\neg a \land \neg b$$`],
      [r`Arithmetische Folge: Formel für $a_n$ und für die Summe $S_n$?`,
        r`$$a_n = a_1 + (n-1)\cdot d$$
$$S_n = \frac{n\,(a_1 + a_n)}{2}$$`],
      [r`Geometrische Folge: Formel für $a_n$? Wann ist sie (mit $a_1 > 0$) streng monoton fallend?`,
        r`$$a_n = a_1 \cdot q^{\,n-1}$$
Streng monoton fallend für $0 < q < 1$.`],
      [r`Bestimmen Sie den Grenzwert: $$a_n = \frac{2n+5}{4n-7}$$`,
        r`Zähler und Nenner durch $n$ teilen:
$$\frac{2+\frac{5}{n}}{4-\frac{7}{n}} \longrightarrow \frac{2}{4} = \frac{1}{2}$$`],
      [r`Wann konvergiert die geometrische Reihe $\sum_{k=0}^{\infty} q^k$ und wogegen?`,
        r`Nur für $|q| < 1$:
$$\sum_{k=0}^{\infty} q^k = \frac{1}{1-q}$$
Für $|q| \ge 1$ divergent.`],
      [r`Wie viele Glieder hat $\sum_{k=0}^{10} q^k$? Wie lautet die Summenformel?`,
        r`**11 Glieder** (k = 0, 1, …, 10)
$$\sum_{k=0}^{10} q^k = \frac{1-q^{11}}{1-q}$$`],
      [r`Wie lautet die pq-Formel? Wann gibt es keine reelle Lösung?`,
        r`Für $x^2 + px + q = 0$:
$$x_{1,2} = -\frac{p}{2} \pm \sqrt{\left(\frac{p}{2}\right)^2 - q}$$
Keine reelle Lösung, wenn der Ausdruck unter der Wurzel $< 0$ ist.`],
      [r`Wann ist $f$ achsensymmetrisch zur y-Achse, wann punktsymmetrisch zum Ursprung?`,
        r`Ansatz: $f(-x)$ berechnen.
$f(-x) = f(x)$ → achsensymmetrisch (nur gerade Exponenten)
$f(-x) = -f(x)$ → punktsymmetrisch (nur ungerade Exponenten)`],
      [r`Berechnen Sie mit der h-Methode die Steigung von $f(x) = x^2$ bei $x_0 = 3$.`,
        r`$$\frac{(3+h)^2 - 9}{h} = \frac{6h + h^2}{h} = 6 + h \xrightarrow{h \to 0} 6$$
Allgemein: $f'(x) = 2x$`],
      [r`Was ist der Unterschied zwischen einer hebbaren Definitionslücke und einer Polstelle?`,
        r`**Hebbar:** Der Faktor lässt sich kürzen → „Loch“ im Graphen.
**Polstelle:** Der Faktor bleibt im Nenner → senkrechte Asymptote $x = x_0$.`],
      [r`Gebrochenrationale Funktion: Wie bestimmt man die waagerechte Asymptote?`,
        r`Zählergrad < Nennergrad → $y = 0$
Zählergrad = Nennergrad → $y = \frac{\text{Leitkoeff. Zähler}}{\text{Leitkoeff. Nenner}}$
Zählergrad > Nennergrad → keine waagerechte Asymptote`],
      [r`Gauß-Verfahren: Was bedeutet eine Zeile $(0\ 0\ 0 \mid 0)$ und was eine Zeile $(0\ 0\ 0 \mid c)$ mit $c \neq 0$?`,
        r`$(0\ 0\ 0 \mid 0)$: Nullzeile → **unendlich viele Lösungen** ($z = t$ frei wählbar)
$(0\ 0\ 0 \mid c)$: Widerspruch → **keine Lösung**, $\mathbb{L} = \{\}$`],
    ],
  },
  {
    name: 'Physik',
    emoji: '⚡',
    cards: [
      [r`Was bedeutet negative bzw. positive Ladung eines Körpers?`,
        r`**Negativ:** Elektronenüberschuss
**Positiv:** Elektronenmangel
Ein neutraler Körper hat gleich viele positive wie negative Ladungen.`],
      [r`Wie wirken gleichnamige und ungleichnamige Ladungen aufeinander?`,
        r`Gleichnamige Ladungen **stoßen sich ab**.
Ungleichnamige Ladungen **ziehen sich an**.`],
      [r`Wie ist die Einheit 1 Coulomb definiert?`,
        r`Fließt ein Strom von 1 A eine Sekunde lang, wird die Ladung 1 C übertragen.
$$Q = I \cdot t \qquad 1\,\text{C} = 1\,\text{A} \cdot 1\,\text{s}$$`],
      [r`Ein Strom von $I = 2\,\text{A}$ fließt $30\,\text{s}$ lang. Welche Ladung wird transportiert?`,
        r`$$Q = I \cdot t = 2\,\text{A} \cdot 30\,\text{s} = 60\,\text{C}$$`],
      [r`Wie ist die elektrische Feldstärke definiert? Einheit?`,
        r`Kraft auf eine Probeladung geteilt durch die Probeladung:
$$E = \frac{F}{q} \qquad [E] = 1\,\frac{\text{N}}{\text{C}}$$`],
      [r`Nennen Sie fünf Eigenschaften elektrischer Feldlinien.`,
        r`1. Sie verlaufen von + nach −.
2. Sie stehen senkrecht auf der Leiteroberfläche.
3. Sie schneiden sich nicht.
4. Sie sind nicht real, nur ein Hilfsmittel.
5. Ihre Dichte ist proportional zur Feldstärke.`],
      [r`Was ist ein homogenes elektrisches Feld? Wo kommt es vor?`,
        r`Feldlinien parallel und gleich dicht → $E$ ist überall gleich groß und gleich gerichtet.
Beispiel: zwischen zwei parallelen, entgegengesetzt geladenen Platten (Plattenkondensator).`],
      [r`Wie verlaufen die Feldlinien im radialsymmetrischen Feld einer positiven Punktladung?`,
        r`Sternförmig von der Ladung **nach außen**. Mit wachsendem Abstand werden sie weniger dicht → $E$ nimmt ab.`],
      [r`Formel für die Feldstärke einer Punktladung $Q$ im Abstand $r$?`,
        r`$$E = \frac{1}{4\pi\varepsilon_0} \cdot \frac{Q}{r^2}$$`],
      [r`Was ist $\varepsilon_0$ und welchen Wert hat es?`,
        r`Die **elektrische Feldkonstante**:
$$\varepsilon_0 = 8{,}854 \cdot 10^{-12}\,\frac{\text{As}}{\text{Vm}}$$`],
      [r`Wie lautet das Coulomb'sche Gesetz?`,
        r`Kraft zwischen zwei Punktladungen im Abstand $r$:
$$F = \frac{1}{4\pi\varepsilon_0} \cdot \frac{Q_1 \cdot Q_2}{r^2}$$`],
      [r`Der Abstand zweier Punktladungen wird verdoppelt. Wie ändert sich die Coulombkraft?`,
        r`Wegen $F \sim \frac{1}{r^2}$ wird sie **ein Viertel** so groß:
$$F' = \frac{F}{2^2} = \frac{F}{4}$$`],
      [r`Messreihe: $F/q$ ist bei $r = \text{const.}$ ungefähr konstant. Was folgt daraus?`,
        r`$F \sim q$. Der Quotient $\frac{F}{q}$ hängt nicht von der Probeladung ab, sondern nur vom Feld → das ist die Feldstärke $E$.`],
      [r`In welche Richtung zeigt der Vektor $\vec{E}$ an einem Punkt im Feld?`,
        r`In Richtung der Kraft auf eine **positive** Probeladung:
$$\vec{E} = \frac{\vec{F}}{q}$$`],
    ],
  },
  {
    name: 'Chemie',
    emoji: '⚗️',
    cards: [
      [r`Aus welchen Elementarteilchen besteht ein Atom? Wo befinden sie sich?`,
        r`**Protonen** ($p^+$, Kern), **Neutronen** ($n$, Kern, neutral), **Elektronen** ($e^-$, Atomhülle).`],
      [r`Was gibt die Ordnungszahl an?`,
        r`Die Anzahl der **Protonen** im Kern. Im neutralen Atom ist das auch die Anzahl der Elektronen.`],
      [r`Wie viele Protonen, Neutronen und Elektronen hat $^{35}_{17}\mathrm{Cl}$?`,
        r`17 Protonen, 17 Elektronen,
$35 - 17 = 18$ Neutronen`],
      [r`Was sind Isotope? Nennen Sie ein Beispiel.`,
        r`Atome eines Elements mit gleicher Protonenzahl, aber **unterschiedlicher Neutronenzahl**.
Beispiel: $^{12}_{6}\mathrm{C}$ und $^{14}_{6}\mathrm{C}$`],
      [r`Wie viele Elektronen passen maximal auf die n-te Schale? Werte für K, L, M?`,
        r`$$z_{\max} = 2n^2$$
K-Schale: 2, L-Schale: 8, M-Schale: 18`],
      [r`Wie lautet die Elektronenkonfiguration von Natrium ($Z = 11$)?`,
        r`$$1s^2\,2s^2\,2p^6\,3s^1$$
Kurz: $[\mathrm{Ne}]\,3s^1$`],
      [r`Was sind Valenzelektronen und wie liest man ihre Anzahl im PSE ab?`,
        r`Die Elektronen der **äußersten Schale**. Bei Hauptgruppenelementen entspricht ihre Anzahl der **Hauptgruppennummer**.`],
      [r`Was gibt die Periode (Zeile) im PSE an?`,
        r`Die Anzahl der **besetzten Elektronenschalen**.`],
      [r`Was besagt die Oktettregel?`,
        r`Atome streben 8 Valenzelektronen an (Edelgaskonfiguration), indem sie Elektronen abgeben, aufnehmen oder teilen. (Ausnahme H, Li: 2 Elektronen.)`],
      [r`Was ist die Elektronegativität (EN)? Wie ändert sie sich im PSE?`,
        r`Die Fähigkeit eines Atoms, Bindungselektronen anzuziehen.
In der Periode **nach rechts steigt** sie, in der Gruppe **nach unten sinkt** sie. Höchster Wert: Fluor (4,0).`],
      [r`Wie ändert sich der Atomradius im PSE?`,
        r`In der Periode nach rechts **kleiner** (mehr Kernladung, gleiche Schalenzahl).
In der Gruppe nach unten **größer** (mehr Schalen).`],
      [r`Wann liegt eine Ionenbindung vor? Beispiel?`,
        r`Zwischen Metall und Nichtmetall, große EN-Differenz ($\Delta \text{EN} > 1{,}7$). Elektronen werden übertragen, Ionen ziehen sich an.
Beispiel: $\mathrm{NaCl}$`],
      [r`Wie entsteht ein Natrium-Ion?`,
        r`Na gibt sein Valenzelektron ab und erreicht die Neon-Konfiguration:
$$\mathrm{Na} \rightarrow \mathrm{Na^+} + e^-$$`],
      [r`Unpolare und polare Atombindung: Wie unterscheidet man sie?`,
        r`Gemeinsame Elektronenpaare zwischen Nichtmetallen.
$\Delta \text{EN} < 0{,}4$: unpolar (z. B. $\mathrm{Cl_2}$)
$0{,}4 \le \Delta \text{EN} \le 1{,}7$: polar (z. B. $\mathrm{H_2O}$, Partialladungen $\delta^+ / \delta^-$)`],
      [r`Wie ist die Metallbindung aufgebaut? Welche Eigenschaft folgt daraus?`,
        r`Positive **Atomrümpfe** im Gitter, dazwischen frei bewegliche Valenzelektronen (**Elektronengas**).
→ Metalle leiten elektrischen Strom und Wärme.`],
    ],
  },
  {
    name: 'Deutsch',
    emoji: '📖',
    cards: [
      [r`Nominalisieren Sie: „Wenn man die Temperatur erhöht, steigt der Druck.“`,
        r`**Bei Erhöhung** der Temperatur steigt der Druck.
(auch: Bei einer Temperaturerhöhung …)`],
      [r`Nominalisieren Sie: „Weil die Preise gestiegen sind, kaufen die Leute weniger.“`,
        r`**Wegen des Anstiegs** der Preise kaufen die Leute weniger.
(auch: Aufgrund des Preisanstiegs …)`],
      [r`Nominalisieren Sie: „Obwohl er krank war, ging er zur Schule.“`,
        r`**Trotz seiner Krankheit** ging er zur Schule.`],
      [r`Nominalisieren Sie: „Nachdem die Lösung erhitzt worden war, …“`,
        r`**Nach dem Erhitzen** der Lösung …`],
      [r`Nominalisieren Sie: „Um die Dichte zu bestimmen, misst man Masse und Volumen.“`,
        r`**Zur Bestimmung** der Dichte misst man Masse und Volumen.`],
      [r`Bilden Sie die Nomen: untersuchen, messen, ankommen, entstehen, analysieren.`,
        r`die Untersuchung, die Messung, die Ankunft, die Entstehung, die Analyse`],
      [r`Welche Präpositionen ersetzen im Nominalstil die Konjunktionen „wenn“, „weil“, „obwohl“, „während“, „nachdem“?`,
        r`wenn → **bei**
weil → **wegen / aufgrund**
obwohl → **trotz**
während → **während**
nachdem → **nach**`],
      [r`Wie bildet man das Vorgangspassiv? Formen Sie um: „Man misst die Spannung.“`,
        r`**werden + Partizip II**
Die Spannung **wird gemessen**.`],
      [r`Bilden Sie das Passiv Perfekt: „Die Lösung wurde gefiltert.“`,
        r`Die Lösung **ist gefiltert worden**.
(Im Passiv „worden“, nicht „geworden“.)`],
      [r`Passiv mit Modalverb: „Man muss die Gleichung lösen.“`,
        r`Die Gleichung **muss gelöst werden**.`],
      [r`Was ist der Unterschied zwischen Vorgangs- und Zustandspassiv?`,
        r`**Vorgangspassiv** (werden + P. II): Der Prozess läuft. „Die Tür wird geöffnet.“
**Zustandspassiv** (sein + P. II): das Ergebnis. „Die Tür ist geöffnet.“`],
      [r`Passiversatzform mit „sich lassen“: „Das Problem kann gelöst werden.“`,
        r`Das Problem **lässt sich lösen**.`],
      [r`Passiversatzform mit „-bar“: „Die Aufgabe kann gelöst werden.“`,
        r`Die Aufgabe ist **lösbar**.`],
      [r`Passiversatzform mit „sein + zu + Infinitiv“: „Die Formel muss gelernt werden.“`,
        r`Die Formel **ist zu lernen**.`],
      [r`Passiv: Wann verwendet man „von“, wann „durch“?`,
        r`**von** + Person/Verursacher: „Der Versuch wird **vom** Lehrer durchgeführt.“
**durch** + Mittel/Ursache: „Das Haus wurde **durch** ein Feuer zerstört.“`],
    ],
  },
];
