(*---
description: Evaluates a random bool expression, seed 262, number 547.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00547 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [a |-> Cardinality(2..1), b |-> (2..1 = 1..3)] \subseteq (((0 .. 1) \ (SUBSET {1} \ {})) \ {b932 \in UNION {{1, 2}, {1, 2}} : (2147483647 < b932)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00547 failed.
    Attempted to check if the non-enumerable value
    0
    is element of
    {{}, {1}}
---*)
