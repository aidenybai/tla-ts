(*---
description: Evaluates a random set expression, seed 262, number 6213.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06213 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> (CHOOSE b9568 \in 2..1 : TRUE), b |-> (1 \in 1..3)] EXCEPT !.a = ((0 + 7) * (2 + 1))] \cap (((<<3, 1, 2>> \o <<1>>) \ DOMAIN [a |-> 1]) \cap (SubSeq(<<1, 2>>, 0, 7) = [<<5, 6>> EXCEPT ![SUBSET {1}] = 7]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06213 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 26 to line 14, col 53 of module random_06213
---*)
