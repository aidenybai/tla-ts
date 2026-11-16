---- MODULE Lib ----
CONSTANT k
VARIABLE v
Op(a) == a = k
Nxt == v' = k
LOCAL Priv == k
UsesPriv == Priv = k
THEOREM LT == Op(k)
  OBVIOUS
AXIOM LA == k = k
====
