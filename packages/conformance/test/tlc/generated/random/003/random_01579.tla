(*---
description: Evaluates a random set expression, seed 262, number 1579.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01579 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(Head(SubSeq(<<1>>, 7, 3)) .. Head(SortSeq(<<1>>, LAMBDA p, q : p < q))), UNION {({1 : b2519 \in 1..3} \cap UNION {{}, {1}}), ({b2520 : b2520 \in <<1>>} \ DOMAIN [x \in 1..2 |-> x])}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
