(*---
description: Evaluates a random set expression, seed 262, number 7793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (~FALSE) THEN UNION {SUBSET {1}, {1, 2}} ELSE (0 + 1) \cup {LET b12017 == [x \in Nat |-> x + 1] IN b12017, Cardinality(1..3)}) \cup {Head((<<1>> = (1 :> 2))), LET b12018 == (2147483647 % 2147483647) IN (CHOOSE b12019 \in {x \in 1..3 : x > 1} : FALSE)}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
    2283:0 The argument of Head should be a sequence, but instead it is:
    FALSE
---*)
