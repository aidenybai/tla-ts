(*---
description: Evaluates a random record expression, seed 262, number 8355.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08355 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[FALSE EXCEPT !.a = 1] EXCEPT !.a = (1 \div 7)] EXCEPT !.a = IF (<<3, 1, 2>> = <<5, 6>>) THEN (-1 * 0) ELSE Cardinality({x \in 1..3 : x > 1})] EXCEPT !.a = (Head((<<1>> \o <<3, 1, 2>>)) \div (-(2 = 3)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08355 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
