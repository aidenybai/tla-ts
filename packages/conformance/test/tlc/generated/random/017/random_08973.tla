(*---
description: Evaluates a random seq expression, seed 262, number 8973.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08973 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail([SelectSeq(<<>>, LAMBDA e : e > 0) EXCEPT ![1] = Len(<<1, 2>>)]), (Len(Append(<<1, 2>>, 2147483647)) - (Cardinality({1, 2}) - (-0))), ((IF FALSE THEN 3 ELSE 2 * (CHOOSE b13924 \in {2, 1, 3} : FALSE)) \div ((2147483647 + 2147483647) % (CHOOSE b13925 \in SUBSET {1} : TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 29 to line 14, col 61 of module random_08973
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
