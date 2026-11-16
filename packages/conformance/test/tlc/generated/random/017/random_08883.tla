(*---
description: Evaluates a random set expression, seed 262, number 8883.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08883 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{Head(<<>>) : b13761 \in ({1, 2} \cup 1..3)}, ((0 % 2147483647) .. ((1 :> 2) @@ (1 :> 2)))} \cap ((DOMAIN (1 :> 2) \cap (TRUE .. 0)) \ DOMAIN (7 :> -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08883 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
