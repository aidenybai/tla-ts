(*---
description: Evaluates a random record expression, seed 262, number 669.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00669 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((CHOOSE r \in [a : 1..2] : TRUE)).a, b |-> ((Cardinality({2, 1, 3}) < (Nat \cup SUBSET {1})) \/ ([[a |-> 1] EXCEPT !.a = @ + -1] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    Nat \cup {{}, {1}}
    2266:0 The second argument of < should be an integer, but instead it is:
    Nat \cup {{}, {1}}
---*)
