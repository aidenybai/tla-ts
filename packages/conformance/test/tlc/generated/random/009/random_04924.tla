(*---
description: Evaluates a random bool expression, seed 262, number 4924.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04924 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((<<5, 6>>)[0] = LET b7660 == -1 IN 2147483647) => ((TRUE \/ TRUE) /\ (Nat = {1, 2}))) \/ ((UNION {{2, 1, 3}, {1}} \cup (1 .. 1)) = {Len(<<1, 2>>), Len(<<3, 1, 2>>)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04924 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
