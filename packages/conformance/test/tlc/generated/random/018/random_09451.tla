(*---
description: Evaluates a random bool expression, seed 262, number 9451.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09451 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE r \in [a : 2..1] : TRUE)).a \in UNION {{b14667 : b14667 \in {2, 1, 3}}, (2..1 \cup {x \in 1..3 : x > 1})}) \/ ((\A b14668 \in ({1} \cup {1, 2}) : (1..3 \subseteq {})) /\ ({3, 2} \subseteq UNION {2..1, {x \in 1..3 : x > 1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09451 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_09451
---*)
