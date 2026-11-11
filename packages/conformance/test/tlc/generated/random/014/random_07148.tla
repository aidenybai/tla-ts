(*---
description: Evaluates a random record expression, seed 262, number 7148.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07148 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<Cardinality(({1, 2} \cup {2, 1, 3})), (CHOOSE b10983 \in ({1, 2} \cup {1}) : (7 + 2147483647))>> \o (SelectSeq(Append(<<1>>, 7), LAMBDA e : e > 0) \o SortSeq(<<-1, 7>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07148 failed.
    2178:0 Overflow when computing 7+2147483647
---*)
