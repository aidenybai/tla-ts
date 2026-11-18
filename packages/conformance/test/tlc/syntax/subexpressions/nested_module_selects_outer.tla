(*---
description: "A nested module selects from the outer module's definitions before it, which SANY has resolved by then."
ref: "tla2sany/semantic/Generator.java#generateModule"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE nested_module_selects_outer ----
EXTENDS Naturals
Base == <<{7, 8}, 9>>
Op == Base!1
F(a) == {a, 8}
L == lab :: 2 + 3
---- MODULE Inner ----
CONSTANT c
P == Op!1
Q == F(c)!1
R == L!lab!1
====
I == INSTANCE Inner WITH c <- 3
Test == I!P = {7, 8} /\ I!Q = 3 /\ I!R = 2
====

(*--- recorded
all:
  exit: 0
---*)
