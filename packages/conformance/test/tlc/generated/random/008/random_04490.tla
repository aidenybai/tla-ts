(*---
description: Evaluates a random record expression, seed 262, number 4490.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04490 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = (CHOOSE b7053 \in (DOMAIN <<5, 6>> \cap DOMAIN [x \in 1..2 |-> x]) : ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04490 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
