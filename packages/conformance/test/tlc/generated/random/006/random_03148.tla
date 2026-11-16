(*---
description: Evaluates a random record expression, seed 262, number 3148.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03148 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CASE TRUE -> 0 [] OTHER -> -1 :> ([a |-> 1]).a))[LET b5025 == (0 % 7) IN ([a |-> 1]).a], b |-> (Cardinality((0 .. 3)) \in ({2, 2} \ ({x \in 1..3 : x > 1} \ {1})))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03148 failed.
    A non-function (an integer) was applied as a function.
    line 14, col 23 to line 14, col 111 of module random_03148
---*)
