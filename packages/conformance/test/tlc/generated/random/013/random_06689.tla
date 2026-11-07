(*---
description: Evaluates a random int expression, seed 262, number 6689.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06689 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ([a |-> -1, b |-> FALSE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]) THEN ((0 + 7) * (2147483647 * 7)) ELSE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 0]).a \div <<((3 + 7) % LET b10259 == 3 IN b10259), (CHOOSE b10260 \in [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] : (FALSE => TRUE))>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 1+2147483647
    2178:0 Overflow when computing 1+2147483647
---*)
