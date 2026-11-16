(*---
description: Evaluates a random record expression, seed 262, number 6324.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06324 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head((([x \in 1..2 |-> x] @@ [x \in 1..2 |-> x]) \o SortSeq(<<1>>, LAMBDA p, q : p < q))), b |-> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = (CHOOSE r \in [a : {1, 2}] : TRUE))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> FALSE]"
---*)
