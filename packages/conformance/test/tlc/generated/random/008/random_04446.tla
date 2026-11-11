(*---
description: Evaluates a random int expression, seed 262, number 4446.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04446 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[b6995 \in {} |-> b6995] EXCEPT ![(7 - 7)] = (CHOOSE b6996 \in {1, 2} : [a |-> 1, b |-> TRUE])] EXCEPT !.a = ([a |-> 2, b |-> TRUE]).a]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 42 of module random_04446
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 18 to line 14, col 113 of module random_04446
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04446 failed.
    Attempted to apply function:
    <<>>
    to argument "a", which is not in the domain of the function.
---*)
