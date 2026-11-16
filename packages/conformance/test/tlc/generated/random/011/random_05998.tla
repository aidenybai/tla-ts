(*---
description: Evaluates a random record expression, seed 262, number 5998.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05998 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b9248 == ([[a |-> 1] EXCEPT !.a = @ + -1]).a IN ([a |-> b9248, b |-> TRUE]).a, b |-> (((7).a \in {-1 : b9249 \in {1, 2}}) /\ ([[a |-> 1] EXCEPT !.a = @ + 3] = (<<1, 2>> = [x \in Nat |-> x + 1])))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05998 failed.
    Attempted to select field "a" from a non-record value 7
    line 14, col 114 to line 14, col 118 of module random_05998
---*)
