(*---
description: Evaluates a random seq expression, seed 262, number 2509.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02509 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<{(LET b3958 == b3957 IN b3958 * CASE FALSE -> b3957 [] OTHER -> b3957) : b3957 \in DOMAIN (<<5, 6>> @@ (1 :> 2))}, ((\A b3959 \in {3, 3} : ({1} \subseteq {1, 2})) /\ ([[a |-> 1] EXCEPT !.a = 1] = (CHOOSE r \in [a : 2..1] : TRUE)))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02509 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 215 to line 14, col 244 of module random_02509
---*)
