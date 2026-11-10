(*---
description: Evaluates a random seq expression, seed 262, number 1142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Len([FALSE EXCEPT ![1] = 0]) * Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))), IF [[a |-> 0, b |-> FALSE] EXCEPT !.a = (3 + -1)] THEN IF (TRUE <=> FALSE) THEN Cardinality(SUBSET {1}) ELSE Cardinality({2, 1, 3}) ELSE ((1 \div 1) % LET b1831 == 2 IN -1)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01142 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
