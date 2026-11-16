(*---
description: Evaluates a random set expression, seed 262, number 5769.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05769 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([a |-> (CHOOSE b8889 \in Nat : TRUE), b |-> ({2, 1, 3} = {1})]).a, (CASE (3 \in {1, 2}) -> (3)[-1] [] OTHER -> (2 + -1) * ([a |-> 2147483647, b |-> TRUE]).a)})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05769 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 26 to line 14, col 52 of module random_05769
---*)
