(*---
description: Evaluates a random function expression, seed 262, number 6857.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06857 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10510 \in (DOMAIN [b10511 \in Nat |-> 1] \ (({1, 2} \cap <<>>) \cap (\A b10512 \in SUBSET {1} : TRUE))) |-> IF ((b10510 :> b10510) @@ [(1 :> 2) EXCEPT ![3] = b10510]) THEN (IF SUBSET {1} THEN 0 ELSE b10510 + ([a |-> 1, b |-> TRUE]).a) ELSE LET b10513 == ([a |-> 1, b |-> TRUE]).a IN (1 * b10510)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06857 failed.
    Attempted to check set membership in a tuple value.
---*)
