(*---
description: Evaluates a random function expression, seed 262, number 7944.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07944 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12265 \in {Cardinality({1 : b12266 \in SUBSET {1}}), Cardinality((7 .. 3))} |-> ((-(1 % b12265)) - (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE))])
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
