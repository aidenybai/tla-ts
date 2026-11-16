(*---
description: Evaluates a random bool expression, seed 262, number 7830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((FALSE <=> TRUE) /\ (\E b12095 \in {} : TRUE)) /\ ((1 - 3) < (3 * 7))) <=> LET b12096 == (LET b12097 == 0 IN b12097 % ([a |-> 1, b |-> TRUE]).a) IN CASE (b12096 = [a |-> 1]) -> LET b12098 == 2147483647 IN b12096 [] OTHER -> (b12096 % b12096)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07830 failed.
    Attempted to check equality of integer 0 with non-integer:
    [a |-> 1]
---*)
