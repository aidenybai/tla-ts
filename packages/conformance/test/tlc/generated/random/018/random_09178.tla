(*---
description: Evaluates a random record expression, seed 262, number 9178.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09178 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {({b14251 \in (TRUE \cup SUBSET {1}) : (2 \in Nat)} \cap {Head(<<1>>), (1 * 0)}), (UNION {({1, 2} \cap {x \in 1..3 : x > 1}), (0 .. 0)} \cap ((-1 + 3) .. (<<1, 2>>).a))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09178 failed.
    Attempted to check if the value:
    1
    is an element of the boolean TRUE
---*)
