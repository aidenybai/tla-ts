(*---
description: Evaluates a random bool expression, seed 262, number 8753.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08753 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 + 2147483647) * (7 * 1)) = ([a |-> 2147483647, b |-> FALSE]).a) \/ ({(TRUE)[7], ([a |-> 1, b |-> TRUE]).a} = (UNION {{1}, 1..3} \ (2147483647 .. 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08753 failed.
    2178:0 Overflow when computing 3+2147483647
---*)
