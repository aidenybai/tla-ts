(*---
description: Evaluates a random int expression, seed 262, number 8928.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08928 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Append(SortSeq(<<>>, LAMBDA p, q : p < q), Cardinality(Nat))) \div DOMAIN (IF TRUE THEN 3 ELSE 1 @@ [<<5, 6>> EXCEPT ![[a |-> 1, b |-> TRUE]] = -1])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    Nat
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
