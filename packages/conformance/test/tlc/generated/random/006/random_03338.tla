(*---
description: Evaluates a random set expression, seed 262, number 3338.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03338 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality({b5307 : b5307 \in 2..1}) - ((1 + 2) + CASE TRUE -> 7 [] OTHER -> [a |-> 1, b |-> TRUE])) .. (((-7) % (0 % -1)) - ((2147483647 - 2) % (CHOOSE b5308 \in {2, 1, 3} : FALSE)))))
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
