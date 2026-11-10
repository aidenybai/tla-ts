(*---
description: Evaluates a random bool expression, seed 262, number 2226.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02226 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b3501 \in UNION {(UNION {{1}, SUBSET {1}} \cap (0 .. 2)), ({3, -1} \ (0 .. 1))} : (((-1) \in UNION {Nat, {}}) => (({x \in 1..3 : x > 1} \cup {2, 1, 3}) = ({1, 2} \cup {2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02226 failed.
    Attempted to check if the non-enumerable value
    0
    is element of
    {{}, {1}}
---*)
