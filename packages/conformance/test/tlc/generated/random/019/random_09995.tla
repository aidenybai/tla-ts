(*---
description: Evaluates a random bool expression, seed 262, number 9995.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09995 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b15539 \in [[a |-> Len(<<1>>), b |-> (0 < 2)] EXCEPT !.a = @ + ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a] : ({Cardinality({}), ([a |-> 1, b |-> TRUE]).a} = {Len(<<1, 2>>) : b15540 \in {b15539, 7}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09995 failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> TRUE].
    line 14, col 31 to line 14, col 125 of module random_09995
---*)
