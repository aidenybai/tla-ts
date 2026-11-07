(*---
description: Evaluates a random function expression, seed 262, number 2880.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02880 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b4566 \in ({b4567 : b4567 \in {x \in 1..3 : x > 1}} \ ([x \in Nat |-> x + 1] \cap {x \in 1..3 : x > 1})) : ((b4566 \in {1}) /\ (-1 < b4566))) :> ((CHOOSE f \in [2..1 -> {1, 2} \cap {2}] : TRUE))[((-2147483647) + CASE FALSE -> 7 [] OTHER -> 2)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02880 failed.
    Attempted to check if the value:
    2
    is an element of the function [x \in Nat |-> <expression line 14, col 95 to line 14, col 99 of module random_02880>]
---*)
