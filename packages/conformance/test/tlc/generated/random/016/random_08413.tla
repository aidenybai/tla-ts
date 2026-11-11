(*---
description: Evaluates a random bool expression, seed 262, number 8413.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08413 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1} \cup 1..3) \cup (1..3 \cap SUBSET {1})) \cup (({1} \cap Nat) \ UNION {1..3, {1, 2}})) \ (CASE (2147483647 < 0) -> [<<5, 6>> EXCEPT ![3] = FALSE] [] OTHER -> (7 % 0) .. (-(2147483647 % 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08413 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
