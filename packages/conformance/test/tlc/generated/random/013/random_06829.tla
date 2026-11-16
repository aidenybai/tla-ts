(*---
description: Evaluates a random bool expression, seed 262, number 6829.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06829 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((<<IF TRUE THEN 2 ELSE 7, (2 + 2)>> = ([b10464 \in 1..3 |-> b10464] @@ (CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE))) \/ (\E b10465 \in ((1..3 \ 1..3) \ {b10466 \in {1} : FALSE}) : ((~FALSE) <=> (1 = 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06829 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 89 to line 14, col 130 of module random_06829
---*)
