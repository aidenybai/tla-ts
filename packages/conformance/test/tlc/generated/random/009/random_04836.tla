(*---
description: Evaluates a random function expression, seed 262, number 4836.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04836 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7551 \in DOMAIN (CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE) |-> ((Head(<<3, 1, 2>>) - Head(<<3, 1, 2>>)) .. (LET b7552 == [x \in 1..2 |-> x] IN 1 \div Head(<<>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
