(*---
description: Evaluates a random set expression, seed 262, number 5476.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05476 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-LET b8472 == 3 IN 3) * (IF FALSE THEN -1 ELSE 2147483647 - Cardinality(SUBSET {1}))) .. ((Cardinality({2, 1, 3}) :> {b8473 \in {} : TRUE}))[(-Cardinality({x \in 1..3 : x > 1}))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing -3*2147483645
    2178:0 Overflow when computing -3*2147483645
---*)
