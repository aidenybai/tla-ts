(*---
description: Evaluates a random bool expression, seed 262, number 4156.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04156 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len((2 .. 3)))[(CHOOSE b6543 \in (1..3 \ {2, 1, 3}) : (-1 < b6543))] \in {((b6544 % b6544) - Head(<<3, 1, 2>>)) : b6544 \in (([a |-> 1, b |-> TRUE]).a :> (<<5, 6>>)[2])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    2..3
    2283:0 The argument of Len should be a sequence, but instead it is:
    2..3
---*)
