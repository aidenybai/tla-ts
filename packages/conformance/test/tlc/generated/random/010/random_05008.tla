(*---
description: Evaluates a random seq expression, seed 262, number 5008.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05008 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<Cardinality({-1, 2147483647}), ([{1, 2} EXCEPT !.a = @ + 0]).a>>, Len(Tail(Append(<<3, 1, 2>>, 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05008 failed.
    Attempted to apply EXCEPT construct to the value {1, 2}.
---*)
