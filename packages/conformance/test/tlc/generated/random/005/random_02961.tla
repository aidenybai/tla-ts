(*---
description: Evaluates a random set expression, seed 262, number 2961.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02961 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(-2147483647) : b4694 \in (SUBSET {1} \ <<3, 1, 2>>)}, ({b4695 : b4695 \in {1, 2}} \cup UNION {{1, 2}, SUBSET {1}})} \cup UNION {(([a |-> 1, b |-> TRUE] - -1) .. (1 * 2)), {Append(<<3, 1, 2>>, -1), CASE TRUE -> 0 [] OTHER -> 7}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02961 failed.
    Attempted to check set membership in a tuple value.
---*)
