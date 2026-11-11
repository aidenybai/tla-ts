(*---
description: Evaluates a random bool expression, seed 262, number 4174.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04174 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [[x \in 1..2 |-> x] EXCEPT ![2147483647] = -1] \subseteq UNION {{[a |-> 1] : b6564 \in {}}, ({1} \ 2..1)}) \/ (([a |-> 2147483647, b |-> TRUE]).a \in ({[a |-> 1], [x \in 1..2 |-> x]} \ (2147483647 .. 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 43 of module random_04174
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04174 failed.
    Attempted to check if the value:
    [a |-> 1]
    is in the integer interval 2147483647..2147483647
---*)
