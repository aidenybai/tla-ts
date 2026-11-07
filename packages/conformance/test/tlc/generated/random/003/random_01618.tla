(*---
description: Evaluates a random function expression, seed 262, number 1618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[((-1 \div 1) :> (1 + 7)) EXCEPT ![Head(<<7, 7>>)] = Len(SelectSeq([x \in Nat |-> x + 1], LAMBDA e : e > 0))] EXCEPT ![Cardinality(((\A b2579 \in 1..3 : TRUE) \cup ({} \ {})))] = Cardinality(({b2580 \in {1, 2} : FALSE} \cup {b2581 \in SUBSET {1} : TRUE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 40 of module random_01618
    2181:0 Attempted to compute cardinality of the value
    TRUE
    2181:0 Attempted to compute cardinality of the value
    TRUE
---*)
