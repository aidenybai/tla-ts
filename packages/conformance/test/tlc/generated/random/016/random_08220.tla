(*---
description: Evaluates a random function expression, seed 262, number 8220.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08220 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> Head(<<1>>), b |-> (2 < 0)]).a :> ([(7 :> 2147483647) EXCEPT ![(-3)] = (2 * 0)])[((-1 \div 3) \div CASE TRUE -> 1 [] OTHER -> 2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 62 to line 14, col 76 of module random_08220
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08220 failed.
    Attempted to apply function:
    (7 :> 2147483647)
    to argument 0, which is not in the domain of the function.
---*)
