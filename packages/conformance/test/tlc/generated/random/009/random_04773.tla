(*---
description: Evaluates a random set expression, seed 262, number 4773.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04773 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b7453 \in (UNION {{b7454 \in 2..1 : TRUE}, UNION {{x \in 1..3 : x > 1}, {x \in 1..3 : x > 1}}} \cap {b7455 \in (0 .. 0) : (b7455 \in SUBSET {1})}) : (~(~([a |-> 1, b |-> TRUE] = b7453)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04773 failed.
    Attempted to check if the non-enumerable value
    0
    is element of
    {{}, {1}}
---*)
