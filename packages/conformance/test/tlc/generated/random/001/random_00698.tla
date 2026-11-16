(*---
description: Evaluates a random set expression, seed 262, number 698.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00698 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(([<<1>> EXCEPT ![1] = 3] \o Append(<<1>>, 2147483647))) .. Cardinality(({2147483647, -1} \cup {3, -1}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3..3"
---*)
