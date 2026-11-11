(*---
description: Evaluates a random bool expression, seed 262, number 4199.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04199 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b6604 \in ((0 \div 3) .. (-1 - 1)) : (\E b6605 \in {b6604, b6604} : (~FALSE))) \in {(([a |-> 1]).a - LET b6607 == b6606 IN {2, 1, 3}) : b6606 \in DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04199 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 101 of module random_04199
---*)
