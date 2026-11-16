(*---
description: Evaluates a random record expression, seed 262, number 773.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00773 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(SortSeq(<<1>>, LAMBDA p, q : p < q)), b |-> (DOMAIN <<5, 6>> \subseteq UNION {{2, 1, 3}, SUBSET {1}})] EXCEPT !.a = @ + (IF (TRUE /\ TRUE) THEN (7 - 7) ELSE (FALSE * 0) - LET b1265 == (CHOOSE b1266 \in {1} : FALSE) IN Len(<<3, 1, 2>>))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00773 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
