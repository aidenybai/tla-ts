(*---
description: Evaluates a random int expression, seed 262, number 4636.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04636 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(<<7, 2147483647>>) * Cardinality(({x \in 1..3 : x > 1} \cap {1}))) % IF (([a |-> 1, b |-> TRUE] = [a |-> 1]) => ({x \in 1..3 : x > 1} = {1, 2})) THEN (-(-7)) ELSE ((CHOOSE b7266 \in 2..1 : FALSE) * (FALSE \/ TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
