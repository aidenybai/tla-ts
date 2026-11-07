(*---
description: Evaluates a random bool expression, seed 262, number 2774.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02774 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = (7 * 3)] EXCEPT !.a = @ + Head(SelectSeq(<<1, 2>>, LAMBDA e : e > 0))] = [[a |-> (0 % -1), b |-> (\A b4382 \in 2..1 : TRUE)] EXCEPT !.a = (Head(<<1>>) \div Len(<<1>>))]))
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
