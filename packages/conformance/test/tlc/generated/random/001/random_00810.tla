(*---
description: Evaluates a random seq expression, seed 262, number 810.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00810 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<LET b1325 == (CHOOSE b1326 \in {2, 1, 3} : TRUE) IN Cardinality(SUBSET {1}), (IF FALSE THEN 1 ELSE -1 % (2 - 2))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
