(*---
description: Evaluates a random record expression, seed 262, number 4393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE))[IF (3 = -1) THEN (-1 \div 0) ELSE Head(<<>>)], b |-> ((([a |-> 1]).a \div Head(<<3, 1, 2>>)) < (-Cardinality(Nat)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
