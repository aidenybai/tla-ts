(*---
description: Evaluates a random bool expression, seed 262, number 998.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00998 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {(Cardinality(SUBSET {1}) .. Head(<<>>)), ((2..1 \cup 2..1) \cup {2, 2147483647})}, (DOMAIN [b1599 \in SUBSET {1} |-> <<1>>] \cup (IF FALSE THEN 2 ELSE -1 .. (-2147483647)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
