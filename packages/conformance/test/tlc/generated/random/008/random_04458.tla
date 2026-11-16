(*---
description: Evaluates a random bool expression, seed 262, number 4458.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04458 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1 - -1) \cap ({1} \ SUBSET {1})) \ (DOMAIN [x \in Nat |-> x + 1] \cap (2147483647 .. -1))) = {LET b7018 == (0 \div 0) IN (<<5, 6>>)[b7018], (LET b7019 == {2, 1, 3} IN -1 - (-1))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04458 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
