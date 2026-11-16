(*---
description: Evaluates a random set expression, seed 262, number 963.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00963 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((Nat \cap {2, 1, 3}) \cap (SUBSET {1} \ {x \in 1..3 : x > 1})) \ ((7 + 7) .. (7 + 1))) \cup {Head(Append(<<3, 1, 2>>, {x \in 1..3 : x > 1})) : b1558 \in UNION {(SUBSET {1} \cap SUBSET {1}), DOMAIN [x \in Nat |-> x + 1]}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00963 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
