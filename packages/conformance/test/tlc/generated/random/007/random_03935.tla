(*---
description: Evaluates a random function expression, seed 262, number 3935.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03935 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(SortSeq(<<>>, LAMBDA p, q : p < q)) :> (CHOOSE f \in [{1, 2} -> {1, 2}] : TRUE)) @@ ((([x \in Nat |-> x + 1] @@ [x \in 1..2 |-> x]) @@ (1 :> 1)) @@ (CHOOSE f \in [{2, 1, 3} -> {2, 1, 3}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
