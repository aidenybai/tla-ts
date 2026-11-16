(*---
description: Evaluates a random seq expression, seed 262, number 9626.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09626 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq(SortSeq(Append(<<3, 1, 2>>, 2), LAMBDA p, q : p < q), LAMBDA p, q : p < q), (CHOOSE b14946 \in SubSeq((<<3, 1, 2>> \o <<>>), (-1 + 2147483647), ([x \in Nat |-> x + 1])[1]) : (\A b14947 \in (b14946 .. SUBSET {1}) : ([a |-> 1] = [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09626 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 108 to line 14, col 268 of module random_09626
---*)
