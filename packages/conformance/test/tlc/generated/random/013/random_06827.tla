(*---
description: Evaluates a random set expression, seed 262, number 6827.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06827 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CASE FALSE -> b10461 [] OTHER -> b10461 * (2147483647 * 7)) % (-(b10461 * b10461))) : b10461 \in (CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06827 failed.
    TLC encountered a non-enumerable quantifier bound
    (0 :> 1 @@ 1 :> 1).
    line 14, col 117 to line 14, col 157 of module random_06827
---*)
