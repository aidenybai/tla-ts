(*---
description: Evaluates a random bool expression, seed 262, number 2126.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02126 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b3371 \in UNION {DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE), ((1..3 \ {2, 1, 3}) \cup {2147483647, 2147483647})} : (((7 - b3371) < Cardinality(<<>>)) /\ ((b3371 + 1) < (3 \div 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<>>
    2181:0 Attempted to compute cardinality of the value
    <<>>
---*)
