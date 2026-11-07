(*---
description: Evaluates a random function expression, seed 262, number 5889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([([((1 :> 2) @@ [x \in 1..2 |-> x]) EXCEPT ![Head(<<>>)] = Len(<<1, 2>>)] @@ (CHOOSE f \in [{0} \cup {1} -> {0} \cup {1}] : TRUE)) EXCEPT ![((CHOOSE f \in [{} -> {1}] : TRUE) @@ ([(1 :> 2) EXCEPT ![2] = 2147483647] @@ (-1 :> 0)))] = IF ((-1 % 2) < (7 * 2147483647)) THEN ((-7) * Len(<<1, 2>>)) ELSE (([x \in 1..2 |-> x])[1] + (3 * 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
