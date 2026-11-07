(*---
description: Evaluates a random seq expression, seed 262, number 137.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00137 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(SortSeq(Append(<<1, 2>>, 7), LAMBDA p, q : p < q), LAMBDA e : e > 0) \o SelectSeq(({b217 \in Nat : TRUE} = (-1 .. 2147483647)), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00137 failed.
    Attempted to enumerate { x \in S : p(x) } when S:
    Nat
    is not enumerable
---*)
