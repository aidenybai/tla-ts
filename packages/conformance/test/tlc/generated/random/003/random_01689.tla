(*---
description: Evaluates a random set expression, seed 262, number 1689.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01689 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((-1 + 0) :> LET b2699 == 0 IN b2699))[(-(-1))], (((7 + 2147483647) \div CASE FALSE -> 0 [] OTHER -> -1) - ([[a |-> 1] EXCEPT !.a = 2]).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01689 failed.
    Attempted to apply function:
    (-1 :> 0)
    to argument 1, which is not in the domain of the function.
---*)
