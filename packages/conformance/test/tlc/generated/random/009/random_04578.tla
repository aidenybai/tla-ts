(*---
description: Evaluates a random set expression, seed 262, number 4578.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04578 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(DOMAIN [b7179 \in SUBSET {1} |-> 2147483647] \ ((7 .. 3) \cup (3 .. 3))), DOMAIN ((CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE) @@ (CHOOSE f \in [{2, 1, 3} -> 2..1] : TRUE))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04578 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 107 to line 14, col 149 of module random_04578
---*)
