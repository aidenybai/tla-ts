(*---
description: Evaluates a random set expression, seed 262, number 8638.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08638 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![[a |-> 1, b |-> TRUE]] = -1] \cup ((SUBSET {1} \cap Nat) \cup {2, 2147483647})) \cup ((Tail(<<1, 2>>) - (2 - 7)) .. IF (FALSE < 0) THEN CASE [a |-> 1, b |-> TRUE] -> 3 [] OTHER -> 2 ELSE (0 * 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08638 failed.
    2158:0 Attempted to check if the value:
    [a |-> 1, b |-> TRUE]
    is an element of Nat.
---*)
