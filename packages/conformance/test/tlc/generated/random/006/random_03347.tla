(*---
description: Evaluates a random set expression, seed 262, number 3347.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03347 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5317 \in (((7 - -1) \div Len(<<>>)) .. ((-1 \div 3) * (-3))) : ((((1 :> 2))[b5317] < (2 * 7)) = [b5318 \in {b5317 : b5319 \in {1}} |-> ([x \in Nat |-> x + 1])[b5318]])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
