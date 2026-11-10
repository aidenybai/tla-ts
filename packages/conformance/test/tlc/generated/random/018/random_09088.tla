(*---
description: Evaluates a random record expression, seed 262, number 9088.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09088 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(Tail((<<1, 2>> \o <<1>>))), b |-> ((-Cardinality({1})) = ([{2, 1, 3} EXCEPT !.a = @ + 7]).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09088 failed.
    Attempted to apply EXCEPT construct to the value {1, 2, 3}.
---*)
