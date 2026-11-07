(*---
description: Evaluates a random bool expression, seed 262, number 8100.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08100 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 - 1) < ([a |-> 1, b |-> TRUE]).a) \/ ((1..3 \cup {2, 1, 3}) \subseteq DOMAIN (1 :> 2))) \/ (((-1 \div 0) \div (2 - -1)) \in {((1 :> 2))[-1], (1 * 2)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
