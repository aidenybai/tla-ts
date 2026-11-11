(*---
description: Evaluates a random bool expression, seed 262, number 333.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00333 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~((CHOOSE b561 \in Nat : TRUE) :> Len(<<1, 2>>))) <=> (DOMAIN (CHOOSE f \in [{0} \cup {1} -> {1, 2}] : TRUE) \subseteq {IF FALSE THEN 0 ELSE 1, (CHOOSE b562 \in {1, 2} : TRUE)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00333 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 21 to line 14, col 46 of module random_00333
---*)
