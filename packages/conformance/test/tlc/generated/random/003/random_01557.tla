(*---
description: Evaluates a random bool expression, seed 262, number 1557.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01557 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(((<<5, 6>>)[7] :> Head(<<3, 1, 2>>))), LET b2486 == (-IF [x \in Nat |-> x + 1] THEN 2147483647 ELSE 3) IN Head(SortSeq(<<1>>, LAMBDA p, q : p < q)), Len(SelectSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01557 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
