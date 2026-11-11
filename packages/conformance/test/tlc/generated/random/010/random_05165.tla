(*---
description: Evaluates a random seq expression, seed 262, number 5165.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05165 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SortSeq(SelectSeq(<<>>, LAMBDA e : e > 0), LAMBDA p, q : p < q), ((1 - 1) - (0).a), ((CHOOSE f \in [{0} \cup {1} -> {1, 2} \ {1}] : TRUE))[(2147483647)[2147483647]]) \o [Tail(SubSeq(<<1>>, 2, 1)) EXCEPT ![1] = (-CASE TRUE -> -1 [] OTHER -> 2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05165 failed.
    Attempted to select field "a" from a non-record value 0
    line 14, col 100 to line 14, col 104 of module random_05165
---*)
