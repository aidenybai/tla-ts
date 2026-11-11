(*---
description: Evaluates a random set expression, seed 262, number 9600.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09600 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({CASE ((1 \in [a |-> 1, b |-> TRUE]) => (2147483647 = 7)) -> Tail(<<2, -1>>) [] OTHER -> ([[x \in 1..2 |-> x] EXCEPT ![0] = -1]).a, Append(<<LET b14905 == 1 IN b14905, CASE FALSE -> 3 [] OTHER -> 1>>, CASE (~TRUE) -> ([a |-> 1]).a [] OTHER -> Cardinality({}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09600 failed.
    Attempted to check if element:
    1
    is in the record:
    [a |-> 1, b |-> TRUE]
---*)
