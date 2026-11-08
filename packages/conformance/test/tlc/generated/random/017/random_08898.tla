(*---
description: Evaluates a random record expression, seed 262, number 8898.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08898 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 7, b |-> FALSE] EXCEPT !.a = (CHOOSE b13781 \in {1} : TRUE)] EXCEPT !.a = @ + Head(SubSeq(7, 7, 3))] EXCEPT !.a = @ + [[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = (<<1>> % 7)] EXCEPT !.a = @ + CASE (\A b13782 \in {1} : TRUE) -> Cardinality({1, 2}) [] OTHER -> (2147483647 - -1)]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08898 failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    7
---*)
