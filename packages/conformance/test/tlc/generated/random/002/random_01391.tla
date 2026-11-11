(*---
description: Evaluates a random set expression, seed 262, number 1391.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01391 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [(1 :> 2) EXCEPT ![-1] = 3] \ (DOMAIN [x \in Nat |-> x + 1] \cap DOMAIN <<5, 6>>)) \cap (((SUBSET {1} \cup 2..1) \cup ({1, 2} \ 1..3)) \ {(FALSE => TRUE) : b2221 \in DOMAIN [x \in 1..2 |-> x]})))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 27 to line 14, col 32 of module random_01391
    | {}
---*)
