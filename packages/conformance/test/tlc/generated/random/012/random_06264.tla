(*---
description: Evaluates a random seq expression, seed 262, number 6264.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06264 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq([SortSeq(<<>>, LAMBDA p, q : p < q) EXCEPT ![1] = Len(<<>>)], LAMBDA e : e > 0), IF ({2, 0} \subseteq {0 : b9648 \in {1, 2}}) THEN Head((<<1>> \o <<1, 2>>)) ELSE (Cardinality({1, 2}) \div (3 % 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 34 to line 14, col 67 of module random_06264
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
