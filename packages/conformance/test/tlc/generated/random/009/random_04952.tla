(*---
description: Evaluates a random seq expression, seed 262, number 4952.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04952 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((-([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]).a), (CHOOSE b7704 \in {([x \in Nat |-> x + 1])[-1] : b7705 \in {b7706 \in {1} : FALSE}} : (((1 :> 2))[7] \in UNION {{}, SUBSET {1}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04952 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 76 to line 14, col 202 of module random_04952
---*)
