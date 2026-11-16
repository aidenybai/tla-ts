(*---
description: Evaluates a random bool expression, seed 262, number 9172.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09172 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((((1 :> 2) @@ <<5, 6>>) @@ (CHOOSE f \in [{1, 2} -> 2..1] : TRUE)))[((-1 - 2) % Head(<<3, 1, 2>>))] = [[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = @ + (CHOOSE f \in [{0} \cup {1} -> {1}] : TRUE)] EXCEPT !.a = Len((<<1, 2>> \o <<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09172 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 46 to line 14, col 81 of module random_09172
---*)
