(*---
description: Evaluates a random bool expression, seed 262, number 6622.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06622 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-1 .. 3) .. (2147483647 + 2147483647)) \cup {b10169 \in {<<>> : b10170 \in {x \in 1..3 : x > 1}} : (FALSE => FALSE)}) = ((UNION {{1, 2}, {1, 2}} \ ({x \in 1..3 : x > 1} \cup SUBSET {1})) \cup {(7 + 2) : b10171 \in {7 : b10172 \in {x \in 1..3 : x > 1}}})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06622 failed.
    2178:0 Overflow when computing 2147483647+2147483647
---*)
