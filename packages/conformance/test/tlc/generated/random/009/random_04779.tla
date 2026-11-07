(*---
description: Evaluates a random int expression, seed 262, number 4779.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04779 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b7461 == Cardinality({(b7462 - b7462) : b7462 \in (2147483647 .. 7)}) IN (-Cardinality((<<5, 6>> \cup 2..1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<5, 6>>
    2181:0 Attempted to compute cardinality of the value
    <<5, 6>>
---*)
