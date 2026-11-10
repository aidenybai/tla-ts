(*---
description: Evaluates a random set expression, seed 262, number 6211.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06211 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{(2147483647 + 1), (-7)}, ({b9566 \in {2, 1, 3} : TRUE} \cup (1 :> -1))} \ {(-(3 + 1)), (CHOOSE b9567 \in (1 .. 0) : (b9567 = 7))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06211 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
