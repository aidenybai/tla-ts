(*---
description: Evaluates a random int expression, seed 262, number 2069.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02069 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((~FALSE) => (\E b3294 \in {2, 1, 3} : FALSE)))[CASE (-2147483647) -> ([a |-> 1, b |-> TRUE] + 3) [] OTHER -> (2147483647 % 1)] \div LET b3295 == ((2147483647 * 3) * CASE FALSE -> 1 [] OTHER -> 7) IN Cardinality(UNION {{1, 2}, {1}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02069 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 17 to line 14, col 144 of module random_02069
---*)
