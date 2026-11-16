(*---
description: Evaluates a random record expression, seed 262, number 9394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b14573 == (CHOOSE b14574 \in (Nat \cup {}) : (<<3, 1, 2>> = (1 :> 2))) IN LET b14575 == (7 * 3) IN (b14573 + 0), b |-> (\A b14576 \in {b14577 \in DOMAIN [x \in Nat |-> x + 1] : (FALSE <=> TRUE)} : Cardinality({b14576, b14576}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09394 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 38 to line 14, col 95 of module random_09394
---*)
