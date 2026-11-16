(*---
description: Evaluates a random record expression, seed 262, number 4386.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04386 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Cardinality({7, 2147483647}), b |-> (([a |-> 1, b |-> TRUE] = 0) /\ (<<1>> => 2..1))] EXCEPT !.a = LET b6902 == Cardinality({0, 7}) IN Head(SubSeq(<<1, 2>>, 2, 7))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04386 failed.
    Attempted to check equality of record:
    [a |-> 1, b |-> TRUE]
    with non-record
    0
---*)
