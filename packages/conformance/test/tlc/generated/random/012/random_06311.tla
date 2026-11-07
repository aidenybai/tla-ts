(*---
description: Evaluates a random bool expression, seed 262, number 6311.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06311 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 < 3) \/ ({1, 2} = {2, 1, 3})) => (({} \subseteq {2, 1, 3}) => (~FALSE))) <=> ([[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = @ + CASE TRUE -> -1 [] OTHER -> 2] = [a |-> (0 % 0), b |-> (<<1, 2>> = (1 :> 2))])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
