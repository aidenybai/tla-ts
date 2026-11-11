(*---
description: Evaluates a random set expression, seed 262, number 2085.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02085 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b3322 \in (2..1 \cup {}) |-> ({x \in 1..3 : x > 1} \cap {})] \cup (((0 .. 0) \cap (SUBSET {1} \cup 2..1)) \cup (IF FALSE THEN 7 ELSE 1 .. (2 * 2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02085 failed.
    Attempted to check if the non-enumerable value
    0
    is element of
    {{}, {1}}
---*)
