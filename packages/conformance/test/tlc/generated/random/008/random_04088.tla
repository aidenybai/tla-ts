(*---
description: Evaluates a random set expression, seed 262, number 4088.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04088 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(Head([a |-> 1, b |-> TRUE]) - Head(<<1>>)) : b6427 \in {b6428 \in (Nat \ {1, 2}) : SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)}} \ ([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = Cardinality({2, 1, 3})] \cap (Len(<<3, 1, 2>>) .. (2147483647 * 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04088 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
