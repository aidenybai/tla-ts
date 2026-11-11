(*---
description: Evaluates a random set expression, seed 262, number 3033.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03033 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{b4821 \in (Nat \ {2, 1, 3}) : (1 < <<3, 1, 2>>)}, DOMAIN [b4822 \in 1..3 |-> 0]} \cap UNION {((2 % 3) .. (0 % 1)), (DOMAIN <<5, 6>> \ DOMAIN [a |-> 1])}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03033 failed.
    Attempted to check equality of string "a" with non-string:
    1
---*)
