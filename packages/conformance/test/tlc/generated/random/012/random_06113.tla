(*---
description: Evaluates a random bool expression, seed 262, number 6113.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06113 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b9407 == 0 IN -1 .. (<<5, 6>>)[2147483647]) \cup {b9408 \in {b9409 : b9409 \in {2, 1, 3}} : (FALSE \subseteq Nat)}) = (((CHOOSE f \in [{2, 1, 3} -> {1, 2} \ {1}] : TRUE))[(CHOOSE b9410 \in Nat : FALSE)] .. ((2 * 1) + (TRUE => TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06113 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
