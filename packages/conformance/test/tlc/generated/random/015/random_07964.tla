(*---
description: Evaluates a random seq expression, seed 262, number 7964.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07964 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append(SelectSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA e : e > 0), (DOMAIN [x \in Nat |-> x + 1] \subseteq ({2, 1, 3} \ 2..1))) \o SelectSeq((Tail(<<>>) \o SubSeq(<<>>, 0, 2)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07964 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 91 to line 14, col 147 of module random_07964
---*)
