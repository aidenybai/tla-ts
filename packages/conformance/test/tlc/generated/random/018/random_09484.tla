(*---
description: Evaluates a random record expression, seed 262, number 9484.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09484 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((7 - 2) + (3 \div 7)), b |-> (\E b14730 \in {[a |-> 1] : b14731 \in {1, 2}} : (b14730 \in 1..3))] EXCEPT !.a = @ + IF ((2 % -1) \in {b14732 \in {1, 2} : TRUE}) THEN LET b14733 == Cardinality({1, 2}) IN (-b14733) ELSE Len(<<7, 3>>)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09484 failed.
    Attempted to check if the value:
    [a |-> 1]
    is in the integer interval 1..3
---*)
