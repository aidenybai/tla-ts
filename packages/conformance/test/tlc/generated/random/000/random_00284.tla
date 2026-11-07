(*---
description: Evaluates a random int expression, seed 262, number 284.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00284 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({(-LET b481 == 3 IN 2), (-(CHOOSE b482 \in {x \in 1..3 : x > 1} : [x \in Nat |-> x + 1]))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 55 to line 14, col 114 of module random_00284
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 55 to line 14, col 114 of module random_00284
---*)
