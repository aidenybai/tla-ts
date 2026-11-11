(*---
description: Evaluates a random set expression, seed 262, number 5710.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05710 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE), ((CHOOSE r \in [a : {}] : TRUE)).a} \cup DOMAIN [(<<5, 6>> @@ [x \in Nat |-> x + 1]) EXCEPT ![(-1)] = IF TRUE THEN 2 ELSE 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05710 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 71 to line 14, col 98 of module random_05710
---*)
