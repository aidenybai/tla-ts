(*---
description: Evaluates a random record expression, seed 262, number 2801.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02801 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-Cardinality({<<1>> : b4440 \in {x \in 1..3 : x > 1}})), b |-> (Cardinality((3 .. 7)) = ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -1, b |-> FALSE]"
---*)
