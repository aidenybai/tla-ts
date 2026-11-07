(*---
description: Evaluates a random seq expression, seed 262, number 3023.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03023 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail(<<Len(<<1>>), (7 % -1)>>) EXCEPT ![1] = LET b4808 == ((1 \in SUBSET {1}) \/ (\A b4809 \in {1, 2} : FALSE)) IN Cardinality({0 : b4810 \in 2..1})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
