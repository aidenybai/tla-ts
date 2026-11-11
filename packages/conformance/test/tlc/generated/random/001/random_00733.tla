(*---
description: Evaluates a random record expression, seed 262, number 733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = CASE (~<<1, 2>>) -> (-1 - -1) [] OTHER -> [[a |-> 1] EXCEPT !.a = @ + 1]] EXCEPT !.a = ((CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE))[(-([x \in Nat |-> x + 1])[2147483647])]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00733 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a tuple)
    line 14, col 72 to line 14, col 80 of module random_00733
---*)
