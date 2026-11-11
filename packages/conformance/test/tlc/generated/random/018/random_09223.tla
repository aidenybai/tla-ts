(*---
description: Evaluates a random bool expression, seed 262, number 9223.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09223 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([b14314 \in {} |-> b14314] \in {1, 7}) => (({1, 2} \ SUBSET {1}) \subseteq (1..3 \cup Nat))) <=> ((-(0 * 3)) = IF (7 < <<5, 6>>) THEN ([x \in Nat |-> x + 1])[2147483647] ELSE CASE TRUE -> -1 [] OTHER -> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09223 failed.
    Attempted to check equality of integer 1 with non-integer:
    <<>>
---*)
