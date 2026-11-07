(*---
description: Evaluates a random int expression, seed 262, number 6684.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06684 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (CHOOSE b10249 \in ((3 % 0) .. ((1 :> 2) \div 2)) : ((\A b10250 \in {} : TRUE) => (TRUE <=> TRUE))), b |-> ((Cardinality(SUBSET {1}) * (3 \div 2)) < (Head(<<1, 2>>) + (7 + 1)))])
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
