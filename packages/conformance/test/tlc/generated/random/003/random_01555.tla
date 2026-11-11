(*---
description: Evaluates a random function expression, seed 262, number 1555.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01555 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [1..2 -> 2..1] : TRUE) @@ ([b2480 \in {2 : b2481 \in {2, 1, 3}} |-> (3 % b2480)] @@ [[b2482 \in {x \in 1..3 : x > 1} |-> b2482] EXCEPT ![(3 \div 1)] = (CHOOSE b2483 \in SUBSET {1} : FALSE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01555 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 18 to line 14, col 51 of module random_01555
---*)
