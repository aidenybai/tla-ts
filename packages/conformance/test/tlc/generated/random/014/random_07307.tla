(*---
description: Evaluates a random set expression, seed 262, number 7307.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07307 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((UNION {Tail(<<1>>), ({x \in 1..3 : x > 1} \ {2, 1, 3})} \cap ((1..3 \ {1, 2}) \cap DOMAIN <<5, 6>>)) \cup DOMAIN (CHOOSE f \in [{1} -> 1..2] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
