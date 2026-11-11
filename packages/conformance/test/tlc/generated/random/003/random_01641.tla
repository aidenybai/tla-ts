(*---
description: Evaluates a random function expression, seed 262, number 1641.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01641 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[FALSE EXCEPT !.a = @ + 2147483647] EXCEPT !.a = @ + (3 \div 1)]).a :> Cardinality(CASE (TRUE \/ TRUE) -> (0 % 0) [] OTHER -> (0 * 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01641 failed.
    Attempted to apply EXCEPT construct to the value FALSE.
---*)
