(*---
description: Evaluates a random bool expression, seed 262, number 404.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00404 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + ([a |-> 1]).a] = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = -1] EXCEPT !.a = @ + (~[a |-> 1, b |-> TRUE])]) <=> ((IF FALSE THEN 2 ELSE 7 = IF TRUE THEN 2 ELSE -1) /\ [[[a |-> 1, b |-> TRUE] EXCEPT !.a = TRUE] EXCEPT !.a = (2 * 1)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00404 failed.
    Attempted to apply the operator ~ to a non-boolean
    (a record)
    line 14, col 144 to line 14, col 165 of module random_00404
---*)
