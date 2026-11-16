(*---
description: Evaluates a random int expression, seed 262, number 412.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00412 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b672 == (({b673 \in [a |-> 1] : b673} \cup SortSeq(<<1>>, LAMBDA p, q : p < q)) = UNION {([a |-> 1, b |-> TRUE] .. 2), (0 .. 2147483647)}) IN Cardinality(({b674 \in {2, 1, 3} : [a |-> 1, b |-> TRUE]} \cup {b675 \in {2, 1, 3} : TRUE})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00412 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a record.
    line 14, col 197 to line 14, col 217 of module random_00412
---*)
