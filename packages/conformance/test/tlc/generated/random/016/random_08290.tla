(*---
description: Evaluates a random set expression, seed 262, number 8290.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08290 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b12837 \in DOMAIN (CHOOSE f \in [{1} -> {1, 2} \cap {2}] : TRUE) : ([(CHOOSE r \in [a : {0} \cup {1}] : TRUE) EXCEPT !.a = @ + Cardinality(Nat)] <=> ((<<1, 2>> = [x \in Nat |-> x + 1]) /\ (2147483647 < b12837)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08290 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
