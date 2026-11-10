(*---
description: Evaluates a random seq expression, seed 262, number 3514.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03514 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail([Tail(Append(<<1, 2>>, -1)) EXCEPT ![1] = Cardinality({b5555 : b5555 \in SUBSET {1}})]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<-1>>"
---*)
