(*---
description: Evaluates a random record expression, seed 262, number 9620.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09620 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((-(1 % 2)) % ((2 * 2147483647) % Cardinality({1}))), b |-> (\A b14939 \in ({b14940 : b14940 \in {1}} \cup (2..1 \cap [x \in 1..2 |-> x])) : ((1..3 \subseteq 1..3) => (TRUE \/ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09620 failed.
    2178:0 Overflow when computing 2*2147483647
---*)
