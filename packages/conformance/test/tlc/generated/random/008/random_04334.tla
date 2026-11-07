(*---
description: Evaluates a random record expression, seed 262, number 4334.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04334 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Len(<<3, 1, 2>>) - LET b6826 == 1 IN b6826) \div (-(1 % -1))), b |-> (\E b6827 \in (CHOOSE r \in [a : {0} \cup {1}] : TRUE) : ((2147483647 = [a |-> 1]) <=> (TRUE \/ FALSE)))])
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
