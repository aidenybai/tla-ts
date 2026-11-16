(*---
description: Evaluates a random seq expression, seed 262, number 4829.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04829 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE b7537 \in DOMAIN (CHOOSE f \in [2..1 -> {1}] : TRUE) : ((~FALSE) <=> (b7537 \in Nat))), IF (\A b7538 \in {2147483647, 2} : (SUBSET {1} \subseteq {2, 1, 3})) THEN (CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) ELSE (Tail(<<1, 2>>) + (<<1>> * 7))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04829 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 110 of module random_04829
---*)
