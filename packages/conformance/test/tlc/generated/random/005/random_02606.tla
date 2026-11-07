(*---
description: Evaluates a random function expression, seed 262, number 2606.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02606 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b4104 \in ({(0 % 0), (-1 * 2)} \cup (IF FALSE THEN 2 ELSE -1 .. ([a |-> 1]).a)) |-> (-(Head(<<>>) \div Len(2..1)))])
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
