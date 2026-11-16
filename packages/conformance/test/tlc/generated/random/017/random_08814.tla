(*---
description: Evaluates a random set expression, seed 262, number 8814.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08814 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(2 :> 0) EXCEPT ![(2147483647 * 1..3)] = (-7)] EXCEPT ![((CHOOSE b13651 \in 1..3 : TRUE) - Head(<<3, 1, 2>>))] = Head([<<1, 2>> EXCEPT ![1] = 2])] .. ((CHOOSE b13652 \in (2 :> 2) : (TRUE /\ TRUE)) * ((-1 + 1) - (2147483647 + 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08814 failed.
    Attempted to check equality of integer 2 with non-integer:
    {}
---*)
