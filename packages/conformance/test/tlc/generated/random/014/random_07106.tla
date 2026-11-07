(*---
description: Evaluates a random set expression, seed 262, number 7106.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07106 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality((Head(<<>>) .. Len(<<>>))), (((2147483647 % 3) \div (-7)) * (CHOOSE b10909 \in {b10910 : b10910 \in SUBSET {1}} : (\A b10911 \in {1} : FALSE)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
