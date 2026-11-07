(*---
description: Evaluates a random set expression, seed 262, number 4081.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04081 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b6414 \in DOMAIN [(1 :> 2) EXCEPT ![7] = 7] : (~(~FALSE))} \cap {(Cardinality(2..1) - ({1, 2})[-1]), LET b6415 == LET b6416 == 2147483647 IN b6416 IN ([a |-> 1]).a}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 37 to line 14, col 42 of module random_04081
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04081 failed.
    A non-function (a set of the form {e1, ... ,eN}) was applied as a function.
    line 14, col 104 to line 14, col 115 of module random_04081
---*)
