(*---
description: Evaluates a random record expression, seed 262, number 1605.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01605 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Cardinality(2..1) - CASE TRUE -> -1 [] OTHER -> 1) \div Head(({1} \cap 1..3))), b |-> ((({2, 1, 3} \cup {x \in 1..3 : x > 1}) \cup ({} \cup 1..3)) \subseteq ({2147483647 : b2562 \in {1}} \cap {-1, 1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1}
---*)
