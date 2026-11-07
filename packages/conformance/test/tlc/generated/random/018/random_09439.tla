(*---
description: Evaluates a random set expression, seed 262, number 9439.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09439 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {([b14650 \in UNION {{2, 1, 3}, SUBSET {1}} |-> (<<3, 1, 2>> = <<5, 6>>)] .. ((CHOOSE b14651 \in (1 :> 2) : TRUE) \div CASE FALSE -> 1 [] OTHER -> 1)), (([a |-> TRUE, b |-> TRUE] \cup ({} \ {2, 1, 3})) \cup ((-1 - 3) .. (2 % -1)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09439 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 101 to line 14, col 133 of module random_09439
---*)
