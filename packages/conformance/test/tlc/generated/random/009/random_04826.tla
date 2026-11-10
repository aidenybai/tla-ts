(*---
description: Evaluates a random bool expression, seed 262, number 4826.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04826 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 1, b |-> FALSE]).a % (([x \in 1..2 |-> x])[3] - (2147483647 \div 2))) < ((([a |-> 1]).a \div IF FALSE THEN 3 ELSE 3) * CASE (~TRUE) -> (0 % -1) [] OTHER -> Len(<<1>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04826 failed.
    In applying the function
    <<1, 2>>,
    the first argument is:
    3
    which is not in its domain.
---*)
