(*---
description: Evaluates a random set expression, seed 262, number 7863.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07863 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((Cardinality({x \in 1..3 : x > 1}) - (7 * 3)) :> (DOMAIN [x \in 1..2 |-> x]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07863 failed.
    Attempted to select field "a" from a non-record value 1..2
    line 14, col 73 to line 14, col 101 of module random_07863
---*)
