(*---
description: Evaluates a random set expression, seed 262, number 529.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00529 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[<<5, 6>> EXCEPT ![2147483647] = -1] EXCEPT ![(7 * 1)] = (2147483647 * 2)] \cap UNION {({} \cup {x \in 1..3 : x > 1}), {2147483647 : b892 \in 1..3}}) \cup ((({} \cup Nat) \cup UNION {{1}, [x \in 1..2 |-> x]}) \ UNION {{2 : b893 \in {x \in 1..3 : x > 1}}, {7 : b894 \in {1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 20 to line 14, col 27 of module random_00529
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 19 to line 14, col 54 of module random_00529
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00529 failed.
    Attempted to check set membership in a tuple value.
---*)
