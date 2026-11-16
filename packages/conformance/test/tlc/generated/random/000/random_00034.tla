(*---
description: Evaluates a random record expression, seed 262, number 34.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (([a |-> 1, b |-> TRUE]).a \div (-3)), b |-> SelectSeq(<<2, 7>>, LAMBDA e : e > 0)] EXCEPT !.a = @ + Cardinality(({7 : b52 \in {1, 2}} \ ({} \cap {1})))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> <<2, 7>>]"
---*)
