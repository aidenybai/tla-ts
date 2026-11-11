(*---
description: Evaluates a random record expression, seed 262, number 5894.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05894 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head(Tail((<<>> \o <<1, 2>>))), b |-> (({7, 0} \cap (FALSE /\ FALSE)) = ((2 .. [a |-> 1, b |-> TRUE]) \ {b9092 \in {2, 1, 3} : [a |-> 1]}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05894 failed.
    Attempted to check if the value:
    7
    is an element of the boolean FALSE
---*)
