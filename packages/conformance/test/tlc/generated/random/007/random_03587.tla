(*---
description: Evaluates a random function expression, seed 262, number 3587.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03587 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b5655 \in ((-2) .. (7 - 2)) : (({2, 1, 3} \ {1, 2}) \subseteq {-1, b5655})) :> (CHOOSE b5656 \in UNION {{b5657 : b5657 \in {1, 2}}, {2, 3}} : ((\E b5658 \in 2..1 : TRUE) \/ (~<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03587 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a tuple)
    line 14, col 199 to line 14, col 203 of module random_03587
---*)
