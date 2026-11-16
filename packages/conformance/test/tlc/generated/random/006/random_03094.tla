(*---
description: Evaluates a random bool expression, seed 262, number 3094.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03094 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (<<1>> = <<5, 6>>) -> (CHOOSE b4934 \in Nat : TRUE) [] OTHER -> IF FALSE THEN 2147483647 ELSE 3 \subseteq ({b4935 \in {} : FALSE} \cup UNION {{}, {2, 1, 3}})) \/ ((UNION {SUBSET {1}, Nat} \subseteq (0 * 0)) => ((2..1 \cup 1..3) = DOMAIN <<5, 6>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03094 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 117 to line 14, col 179 of module random_03094
---*)
