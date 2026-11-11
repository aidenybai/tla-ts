(*---
description: Evaluates a random bool expression, seed 262, number 297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 .. 2) = (1..3 \ SUBSET {1})) /\ (\E b494 \in {b495 \in 1..3 : TRUE} : (FALSE \/ TRUE))) /\ (((0 + 2147483647) % ([a |-> 1]).a) = ((2147483647 * 2147483647) \div (2147483647 + 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00297 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
