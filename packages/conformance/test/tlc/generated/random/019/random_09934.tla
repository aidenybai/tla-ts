(*---
description: Evaluates a random record expression, seed 262, number 9934.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09934 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b15455 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE <=> TRUE)), b |-> ((2..1 \subseteq SUBSET {1}) \/ (TRUE \/ TRUE))] EXCEPT !.a = @ + (CASE ({1, 2} = {}) -> (<<5, 6>>)[2] [] OTHER -> (2 - 2) \div (-(<<5, 6>>)[0]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09934 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 25 to line 14, col 88 of module random_09934
---*)
