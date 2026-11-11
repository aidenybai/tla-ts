(*---
description: Evaluates a random bool expression, seed 262, number 7164.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07164 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((CHOOSE r \in [a : 2..1] : TRUE) => (<<>> = (1 :> 2))) <=> ((-1 * 1) = (3 * 1))) EXCEPT !.a = @ + CASE Cardinality(UNION {{1}, {2, 1, 3}}) -> Cardinality(DOMAIN <<5, 6>>) [] OTHER -> (-{b11013 : b11013 \in SUBSET {1}})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07164 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_07164
---*)
