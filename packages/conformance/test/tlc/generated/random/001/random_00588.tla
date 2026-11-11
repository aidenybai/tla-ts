(*---
description: Evaluates a random bool expression, seed 262, number 588.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00588 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(\A b987 \in {Len(<<>>), Head(<<1, 2>>)} : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b987] = [a |-> <<5, 6>>, b |-> FALSE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00588 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<5, 6>>
---*)
