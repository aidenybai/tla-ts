(*---
description: Evaluates a random set expression, seed 262, number 4614.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04614 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((Nat \cap 2..1) \cup {b7226 \in SUBSET {1} : FALSE}) \cup DOMAIN [<<5, 6>> EXCEPT ![3] = 7]) \cup (((3 % 1) .. (-2147483647)) \ ((2..1 \ Nat) \ ({2, 1, 3} \cap 1..3)))))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 85 to line 14, col 92 of module random_04614
    | {1, 2}
---*)
