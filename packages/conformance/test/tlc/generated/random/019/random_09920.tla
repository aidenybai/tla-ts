(*---
description: Evaluates a random set expression, seed 262, number 9920.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09920 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b15431 \in {b15432 \in ({b15433 \in {x \in 1..3 : x > 1} : {1, 2}} \ {b15434 \in {x \in 1..3 : x > 1} : TRUE}) : (\A b15435 \in DOMAIN <<5, 6>> : (\A b15436 \in {} : TRUE))} : ((({1} \cap {1}) \subseteq ({x \in 1..3 : x > 1} \ SUBSET {1})) /\ (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) /\ ({1} \subseteq 1..3)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09920 failed.
    Attempted to evaluate an expression of form {x \in S : P(x)} when P was a set of the form {e1, ... ,eN}.
    line 14, col 76 to line 14, col 81 of module random_09920
---*)
