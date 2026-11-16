(*---
description: Evaluates a random record expression, seed 262, number 2319.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02319 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((3 \div 0) + Head(<<>>)) + Cardinality((Nat \cap b3672))) : b3672 \in (([(1 :> 2) EXCEPT ![3] = 2147483647])[([a |-> 1, b |-> TRUE]).a] \cap UNION {(FALSE \cap {x \in 1..3 : x > 1}), (2..1 \cup 2..1)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 93 to line 14, col 98 of module random_02319
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02319 failed.
    Attempted to check if the value:
    2
    is an element of the boolean FALSE
---*)
