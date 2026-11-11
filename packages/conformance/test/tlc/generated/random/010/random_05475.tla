(*---
description: Evaluates a random set expression, seed 262, number 5475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(({2, 1, 3} \ {1})) * (-Head(<<1, 2>>))) .. ([(CHOOSE f \in [2..1 -> {1, 2}] : TRUE) EXCEPT !.a = LET b8471 == 1 IN b8471]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05475 failed.
    Attempted to apply function with integer domain to the non-integer argument "a"
---*)
