(*---
description: Evaluates a random seq expression, seed 262, number 8951.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08951 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([Tail([SortSeq(<<1>>, LAMBDA p, q : p < q) EXCEPT ![1] = (-7)]) EXCEPT ![1] = Cardinality({(CHOOSE b13889 \in SUBSET {1} : TRUE) : b13888 \in {b13890 : b13890 \in {1, 2}}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 78 of module random_08951
    | <<>>
---*)
