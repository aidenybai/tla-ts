(*---
description: Evaluates a random function expression, seed 262, number 7048.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07048 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10812 \in {Cardinality(SortSeq([x \in 1..2 |-> x], LAMBDA p, q : p < q)), (((1 :> 2))[1] + CASE FALSE -> 0 [] OTHER -> 1)} |-> (([[a |-> 1, b |-> TRUE] EXCEPT !.a = b10812]).a % [b10813 \in {b10814 : b10814 \in Nat} |-> (b10812 * 7)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
    2181:0 Attempted to compute cardinality of the value
    <<1, 2>>
---*)
