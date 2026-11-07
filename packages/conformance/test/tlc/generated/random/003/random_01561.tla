(*---
description: Evaluates a random function expression, seed 262, number 1561.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01561 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(<<(\E b2493 \in {2, 1, 3} : <<>>), (CHOOSE b2494 \in SUBSET {1} : FALSE)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 29 to line 14, col 57 of module random_01561
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 29 to line 14, col 57 of module random_01561
---*)
