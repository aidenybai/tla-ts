(*---
description: Evaluates a random set expression, seed 262, number 504.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00504 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {({{}, 2147483647} \cup {1, 0}), DOMAIN [b840 \in {1} |-> b840]}, (Head([<<>> EXCEPT ![1] = -1]) .. ((7 - -1) % LET b841 == 3 IN 1))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00504 failed.
    Attempted to check equality of the set {} with the value:
    0
---*)
