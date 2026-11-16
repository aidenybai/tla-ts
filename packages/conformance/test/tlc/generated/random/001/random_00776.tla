(*---
description: Evaluates a random set expression, seed 262, number 776.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00776 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{(((1 :> 2))[2] + (b1273 * b1273)) : b1273 \in {b1274 \in DOMAIN (1 :> 2) : (~FALSE)}}, DOMAIN [b1275 \in {b1276 \in 1..3 : FALSE} |-> IF TRUE THEN b1275 ELSE b1275]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00776 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
