(*---
description: Evaluates a random set expression, seed 262, number 4463.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04463 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{(([x \in Nat |-> x + 1])[0] + (7 % b7021)) : b7021 \in (([a |-> 1]).a .. (3 * 0))}, ((DOMAIN <<5, 6>> \cap (SUBSET {1} \cap {x \in 1..3 : x > 1})) \ UNION {(-1 .. 1), (SUBSET {1} \ {x \in 1..3 : x > 1})})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04463 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
