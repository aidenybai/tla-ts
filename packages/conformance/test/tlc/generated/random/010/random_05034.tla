(*---
description: Evaluates a random function expression, seed 262, number 5034.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE) EXCEPT ![([[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = (2 - 2147483647)]).a] = Cardinality({(0 - 0), (3 - 3)})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 64 of module random_05034
    | <<2, 2, 2>>
---*)
