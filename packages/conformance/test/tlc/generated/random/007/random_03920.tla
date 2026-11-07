(*---
description: Evaluates a random function expression, seed 262, number 3920.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03920 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 + 1) % (2 % -1)) \div Cardinality(({x \in 1..3 : x > 1} \cap 2..1))) :> (Head([<<1>> EXCEPT ![1] = 3]) * (LET b6185 == 2 IN b6185 + ([x \in 1..2 |-> x])[1]))))
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
