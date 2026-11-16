(*---
description: Evaluates a random bool expression, seed 262, number 8940.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08940 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b13867 \in 2..1 : FALSE) % (<<5, 6>> % -1)) .. ((0 + 2147483647) * (-1 * TRUE))) \subseteq (DOMAIN (3 :> 2147483647) \cup {b13868 \in (SUBSET {1} \ 1..3) : ({1} = SUBSET {1})})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08940 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_08940
---*)
