(*---
description: Evaluates a random int expression, seed 262, number 5655.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05655 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE))[CASE (~(<<1, 2>> = [x \in 1..2 |-> x])) -> (([a |-> 1]).a - ([a |-> 1]).a) [] OTHER -> (Head(<<>>) * ((1 :> 2))[2])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
