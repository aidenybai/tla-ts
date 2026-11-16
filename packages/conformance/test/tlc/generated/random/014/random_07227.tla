(*---
description: Evaluates a random record expression, seed 262, number 7227.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07227 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((-(-1 % 2147483647)) * ((-2)).a), b |-> ((Cardinality(1..3) .. (7)[2]) = ({3 : b11104 \in 2..1} \cup {b11105 \in {x \in 1..3 : x > 1} : FALSE}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07227 failed.
    Attempted to select field "a" from a non-record value -2
    line 14, col 47 to line 14, col 54 of module random_07227
---*)
