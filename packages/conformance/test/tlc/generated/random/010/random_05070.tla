(*---
description: Evaluates a random function expression, seed 262, number 5070.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(IF TRUE THEN 3 ELSE 0 :> IF TRUE THEN 2 ELSE [a |-> 1, b |-> TRUE]) EXCEPT ![Cardinality({-1, 3})] = ((7 + 0) \div (3 - 0))] EXCEPT ![(IF (\A b7888 \in {} : b7888) THEN ([a |-> 1]).a ELSE ([x \in Nat |-> x + 1])[2] - (([a |-> 1]).a)[((1 :> 2))[2]])] = Len(SubSeq((<<3, 1, 2>> \o <<1, 2>>), (2147483647 % <<3, 1, 2>>), (-1 * 1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05070 failed.
    Attempted to apply EXCEPT construct to the value 3.
---*)
