(*---
description: Evaluates a random set expression, seed 262, number 3342.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03342 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b5311 \in ({1, 2} \cap {1}) |-> IF TRUE THEN b5311 ELSE b5311] \ DOMAIN [(1 :> 2) EXCEPT ![(7 * 0)] = Cardinality(Nat)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 99 to line 14, col 104 of module random_03342
    | {}
---*)
