(*---
description: Evaluates a random int expression, seed 262, number 9811.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09811 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a, b |-> (\A b15230 \in (1 \ {1, 2}) : (2..1 = b15230))]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09811 failed.
    Attempted to enumerate S \ T when S:
    1
    is not enumerable.
---*)
