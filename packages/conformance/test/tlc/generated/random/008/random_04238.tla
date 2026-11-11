(*---
description: Evaluates a random set expression, seed 262, number 4238.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04238 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((({1, 2} \cap Nat) \cup ({1} \cap <<5, 6>>)) \ {b6664 \in UNION {2..1, 1..3} : (TRUE <=> FALSE)}) \cup {((-1 - 0) - (7 - -1)) : b6665 \in UNION {{0 : b6666 \in {2, 1, 3}}, (2..1 \cap 2..1)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04238 failed.
    Attempted to check set membership in a tuple value.
---*)
