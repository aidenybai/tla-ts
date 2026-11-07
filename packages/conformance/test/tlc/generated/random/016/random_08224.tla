(*---
description: Evaluates a random seq expression, seed 262, number 8224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality((SortSeq(<<1>>, LAMBDA p, q : p < q) \o SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))), UNION {((SUBSET {1} \ {}) \ SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)), (SortSeq(<<1>>, LAMBDA p, q : p < q) \cup {b12724 \in {x \in 1..3 : x > 1} : FALSE})}>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1, 3, 1, 2>>
    2181:0 Attempted to compute cardinality of the value
    <<1, 3, 1, 2>>
---*)
