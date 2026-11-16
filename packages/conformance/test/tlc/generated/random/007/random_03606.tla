(*---
description: Evaluates a random set expression, seed 262, number 3606.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03606 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality((({} \cap {1, 2}) \cap (0 .. b5688))) : b5688 \in (CHOOSE b5689 \in ((CHOOSE b5690 \in {1} : FALSE) .. IF TRUE THEN -1 ELSE 0) : (~(FALSE => TRUE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03606 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 99 to line 14, col 126 of module random_03606
---*)
