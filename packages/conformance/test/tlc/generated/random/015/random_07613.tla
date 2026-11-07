(*---
description: Evaluates a random bool expression, seed 262, number 7613.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07613 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((<<1, 2>> = (1 :> 2)) => (TRUE <=> TRUE)) /\ ((<<>> \o <<1>>) = (<<5, 6>> \cap Nat)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07613 failed.
    Attempted to check equality of the function <<1>> with the value:
    <<5, 6>> \cap Nat
---*)
