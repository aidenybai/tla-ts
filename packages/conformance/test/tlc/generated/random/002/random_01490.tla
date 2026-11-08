(*---
description: Evaluates a random bool expression, seed 262, number 1490.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01490 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\E b2381 \in 2..1 : FALSE) THEN Head(<<3, 1, 2>>) ELSE (2 * 2147483647) < (IF Nat THEN 2147483647 ELSE 3 % (Nat \cap Nat))) <=> ((Head(<<1>>) % (CHOOSE b2382 \in 1..3 : [a |-> 1])) = IF (FALSE <=> TRUE) THEN (<<5, 6>>)[<<>>] ELSE (3 % 2))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01490 failed.
    2178:0 Overflow when computing 2*2147483647
---*)
