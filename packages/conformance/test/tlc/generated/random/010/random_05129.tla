(*---
description: Evaluates a random seq expression, seed 262, number 5129.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05129 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality({b7976 \in (1..3 \cup {1}) : (b7976 \in {1, 2})}), ([a |-> (3 - 2), b |-> (1 < 2147483647)]).a>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1>>"
---*)
