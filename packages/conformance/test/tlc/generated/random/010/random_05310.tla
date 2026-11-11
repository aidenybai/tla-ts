(*---
description: Evaluates a random set expression, seed 262, number 5310.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05310 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b8212 \in (((3 .. 7) \cup {b8213 : b8213 \in {}}) \cap ({FALSE, 0} \cup UNION {SUBSET {1}, {1, 2}})) : ((UNION {{x \in 1..3 : x > 1}, {1}} = DOMAIN (1 :> 2)) /\ ([[a |-> 1] EXCEPT !.a = @ + 7] = {-1 : b8214 \in {2, 1, 3}}))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05310 failed.
    Attempted to compare equality of boolean FALSE with non-boolean:
    3
---*)
