(*---
description: Evaluates a random int expression, seed 262, number 4087.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04087 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = Cardinality({2, 1, 3})) -> (<<2147483647, -1>> - Head(<<1>>)) [] OTHER -> ([[a |-> 1] EXCEPT !.a = @ + 2]).a * LET b6426 == CASE (TRUE \/ 2147483647) -> Head(TRUE) [] OTHER -> Cardinality({2, 1, 3}) IN Len(Tail(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04087 failed.
    Attempted to check equality of record:
    [a |-> 0]
    with non-record
    3
---*)
