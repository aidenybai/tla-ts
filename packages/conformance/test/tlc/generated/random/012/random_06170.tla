(*---
description: Evaluates a random record expression, seed 262, number 6170.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06170 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (([a |-> 1, b |-> TRUE]).a \div ([b9487 \in {2, 1, 3} |-> 7])[Head(<<1>>)]), b |-> (~(<<-1, 2>> = [b9488 \in {2, 1, 3} |-> b9488]))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> TRUE]"
---*)
