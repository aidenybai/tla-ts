(*---
description: Evaluates a random record expression, seed 262, number 4878.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04878 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = (2147483647 - 3)], b |-> ((2147483647 % 3) \in DOMAIN <<5, 6>>)] EXCEPT !.a = CASE ((\E b7597 \in 1..3 : FALSE) /\ (TRUE <=> FALSE)) -> Len(SubSeq(<<1>>, 0, 0)) [] OTHER -> ((7 % 7) % (FALSE \cap {x \in 1..3 : x > 1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04878 failed.
    Attempted to check if the value:
    2
    is an element of the boolean FALSE
---*)
