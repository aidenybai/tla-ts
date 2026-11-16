(*---
description: Evaluates a random record expression, seed 262, number 2269.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02269 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> IF (([x \in 1..2 |-> x] \subseteq {2, 1, 3}) => (<<1, 2>> = <<5, 6>>)) THEN (LET b3578 == 3 IN 2 \div (-2)) ELSE ([a |-> 3, b |-> TRUE]).a, b |-> ({IF FALSE THEN b3579 ELSE <<>> : b3579 \in ({} \cap {1})} \/ ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [[a |-> 1] EXCEPT !.a = (1 :> 2)]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02269 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 28 to line 14, col 65 of module random_02269
---*)
