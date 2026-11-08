(*---
description: Evaluates a random function expression, seed 262, number 3221.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03221 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[<<5, 6>> EXCEPT ![3] = -1] EXCEPT ![(2 % 3)] = Cardinality(2..1)] EXCEPT ![(([a |-> 1, b |-> TRUE]).a % (0 - 1))] = Len(<<0, 7>>)] @@ (CHOOSE f \in [{0} \cup {1} -> {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 27 of module random_03221
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03221 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
