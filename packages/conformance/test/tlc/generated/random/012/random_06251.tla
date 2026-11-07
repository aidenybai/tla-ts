(*---
description: Evaluates a random function expression, seed 262, number 6251.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06251 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Len(TRUE) :> (7 + 2)) @@ ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] :> ([a |-> 1]).a)) EXCEPT ![(CHOOSE b9631 \in UNION {DOMAIN [x \in Nat |-> x + 1], {b9632 \in 1..3 : FALSE}} : (LET b9633 == 1 IN 2147483647 = (2 - b9631)))] = Cardinality(UNION {UNION {1..3, {1, 2}}, ({} \ {x \in 1..3 : x > 1})})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
    2283:0 The argument of Len should be a sequence, but instead it is:
    TRUE
---*)
