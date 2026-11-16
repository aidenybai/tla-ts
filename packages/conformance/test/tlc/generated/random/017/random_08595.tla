(*---
description: Evaluates a random int expression, seed 262, number 8595.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08595 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE r \in [a : {1}] : TRUE) - CASE (\A b13318 \in DOMAIN (1 :> 2) : (SUBSET {1} = Nat)) -> ((2 - FALSE) % [a |-> 0, b |-> TRUE]) [] OTHER -> Len([<<1, 2>> EXCEPT ![1] = 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08595 failed.
    Attempted to check equality of the set {{}, {1}} with the value:
    Nat
---*)
