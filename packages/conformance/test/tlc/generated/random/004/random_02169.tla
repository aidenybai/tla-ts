(*---
description: Evaluates a random function expression, seed 262, number 2169.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02169 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b3421 \in {b3422 \in {2147483647, 3} : ([a |-> 1] \subseteq {1})} |-> (LET b3423 == b3421 IN b3421 \div (CHOOSE b3424 \in {2, 1, 3} : FALSE))] @@ (CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02169 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 58 to line 14, col 80 of module random_02169
---*)
