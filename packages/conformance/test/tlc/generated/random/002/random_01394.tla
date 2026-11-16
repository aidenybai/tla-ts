(*---
description: Evaluates a random int expression, seed 262, number 1394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(((UNION {{1, 2}, 1..3} \ (3 .. -1)) \ (DOMAIN [x \in Nat |-> x + 1] \cup (-1 .. 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01394 failed.
    Size of interval value exceeds the maximum representable size (32bits): -1..2147483647.
---*)
