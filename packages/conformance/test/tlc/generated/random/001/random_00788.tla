(*---
description: Evaluates a random seq expression, seed 262, number 788.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00788 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((0 :> 0))[([x \in Nat |-> x + 1])[-1]] * ((3 * 2) + (1 % 1))), LET b1299 == ((1 - 1) % Cardinality({x \in 1..3 : x > 1})) IN Len(([a |-> 1] \o <<3, 1, 2>>))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00788 failed.
    In applying the function
    [x \in Nat |-> <expression line 14, col 46 to line 14, col 50 of module random_00788>],
    the first argument is:
    -1
    which is not in its domain.
---*)
