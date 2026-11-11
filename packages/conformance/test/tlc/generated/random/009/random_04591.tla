(*---
description: Evaluates a random function expression, seed 262, number 4591.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04591 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[b7194 \in ((7 - 2) .. ([x \in 1..2 |-> x])[2147483647]) |-> ((TRUE <=> TRUE) * (2147483647 \div 2147483647))] EXCEPT ![(-((-7) + (3 % 3)))] = Len(<<Len(<<>>), (2 + 7)>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04591 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    2147483647
    which is not in its domain.
---*)
