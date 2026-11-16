(*---
description: Evaluates a random function expression, seed 262, number 5603.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05603 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN Len(<<3, 1, 2>>) ELSE (CHOOSE b8676 \in 1..3 : TRUE) :> LET b8677 == ([a |-> 1, b |-> TRUE]).a IN (<<5, 6>>)[b8677]) @@ [(CHOOSE f \in [1..2 -> {1, 2} \cap {2}] : TRUE) EXCEPT ![Len(SubSeq(<<3, 1, 2>>, 1, 0))] = Cardinality((2..1 \cup {2, 1, 3}))]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 184 to line 14, col 228 of module random_05603
    | <<5, 2>>
---*)
