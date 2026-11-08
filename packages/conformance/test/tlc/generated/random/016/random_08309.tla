(*---
description: Evaluates a random set expression, seed 262, number 8309.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08309 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{LET b12861 == (<<5, 6>>)[b12860] IN (7 % 0) : b12860 \in ((-7) .. ([a |-> 1]).a)}, (((2 - 2147483647) .. (2147483647 \div [a |-> 1, b |-> TRUE])) \ {b12862 \in (TRUE \cap Nat) : (TRUE <=> FALSE)})})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08309 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
