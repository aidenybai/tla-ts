(*---
description: Evaluates a random seq expression, seed 262, number 8630.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08630 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(SubSeq([b13361 \in 1..3 |-> 2147483647], Cardinality(-1), (1 * 3)), ((CHOOSE b13362 \in <<>> : FALSE) * (CHOOSE b13363 \in Nat : <<1>>))), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    -1
    2181:0 Attempted to compute cardinality of the value
    -1
---*)
