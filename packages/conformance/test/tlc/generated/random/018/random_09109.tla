(*---
description: Evaluates a random set expression, seed 262, number 9109.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09109 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([a |-> (b14155 * b14155), b |-> (FALSE < 2)]).a : b14155 \in {b14156 \in (DOMAIN (1 :> 2) \cup (Nat \ {2, 1, 3})) : ((CHOOSE f \in [1..2 -> {}] : TRUE) <=> (TRUE \/ TRUE))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09109 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
