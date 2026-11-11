(*---
description: Evaluates a random bool expression, seed 262, number 9196.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09196 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[([a |-> 1, b |-> TRUE] = [a |-> 1]) EXCEPT !.a = CASE 2147483647 -> 3 [] OTHER -> 1] EXCEPT !.a = @ + Head(SubSeq(<<3, 1, 2>>, 3, 1))] EXCEPT !.a = (CHOOSE b14268 \in {(CHOOSE b14270 \in SUBSET {1} : TRUE) : b14269 \in DOMAIN (1 :> 2)} : ({b14271 \in {} : FALSE} \subseteq {b14268, 1}))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09196 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
