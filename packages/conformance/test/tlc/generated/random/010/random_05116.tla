(*---
description: Evaluates a random function expression, seed 262, number 5116.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05116 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7955 \in ((Head(<<>>) * Cardinality({x \in 1..3 : x > 1})) \div (([x \in 1..2 |-> x])[2] :> ([a |-> 1]).a)) |-> ((CHOOSE r \in [a : {1, 2}] : TRUE) - (CHOOSE b7956 \in (-1 .. b7955) : (TRUE /\ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05116 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
