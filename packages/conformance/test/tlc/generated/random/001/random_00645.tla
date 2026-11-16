(*---
description: Evaluates a random seq expression, seed 262, number 645.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00645 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE b1077 \in ({7, 1} \ (<<5, 6>> = 0)) : ((b1077 + 2) \in {b1077, 0})) EXCEPT ![1] = Len(((<<3, 1, 2>> = (1 :> 2)) <=> (<<1, 2>> = <<5, 6>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00645 failed.
    Attempted to check equality of the function <<5, 6>> with the value:
    0
---*)
