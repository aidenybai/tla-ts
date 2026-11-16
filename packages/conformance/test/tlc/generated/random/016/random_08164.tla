(*---
description: Evaluates a random function expression, seed 262, number 8164.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08164 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 7, b |-> FALSE]).a - ((Nat \ {1}) \subseteq UNION {<<5, 6>>, SUBSET {1}})) :> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08164 failed.
    Attempted to enumerate S \ T when S:
    Nat
    is not enumerable.
---*)
