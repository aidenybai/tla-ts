(*---
description: Evaluates a random bool expression, seed 262, number 9767.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09767 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b15163 : b15163 \in {x \in 1..3 : x > 1}} \ (1..3 \cap Nat)) = [(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = @ + CASE FALSE -> -1 [] OTHER -> 1]) \/ (DOMAIN [[a |-> 1] EXCEPT ![7] = 2] \subseteq {(<<5, 6>>)[{1, 2}], ([a |-> 1, b |-> TRUE]).a})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09767 failed.
    Attempted to check equality of the set {} with the value:
    [a |-> 3]
---*)
