(*---
description: Evaluates a random bool expression, seed 262, number 8907.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08907 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(SortSeq(<<1>>, LAMBDA p, q : p < q)) * (CHOOSE b13798 \in DOMAIN <<5, 6>> : (\E b13799 \in {1, 2} : {}))) = LET b13800 == ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a IN (CHOOSE b13801 \in {2, b13800} : ({} \ SUBSET {1}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08907 failed.
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 99 to line 14, col 123 of module random_08907
---*)
