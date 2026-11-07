(*---
description: Evaluates a random set expression, seed 262, number 6417.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06417 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 - 3) + (0 % 2)) .. LET b9880 == (-1 + -1) IN (0 - 2147483647)) \ (Cardinality([[a |-> 1, b |-> TRUE] EXCEPT !.a = 3]) .. (SortSeq(<<>>, LAMBDA p, q : p < q) = ([x \in 1..2 |-> x] @@ <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    [a |-> 3, b |-> TRUE]
    2181:0 Attempted to compute cardinality of the value
    [a |-> 3, b |-> TRUE]
---*)
