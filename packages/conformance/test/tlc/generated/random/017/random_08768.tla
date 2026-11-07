(*---
description: Evaluates a random int expression, seed 262, number 8768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE ({2, 1, 3} \subseteq 2..1) -> (1 .. 7) [] OTHER -> ([a |-> 1, b |-> TRUE]).a :> IF (FALSE \/ FALSE) THEN (0 + 1) ELSE ([a |-> 1, b |-> TRUE]).a))[([(0 :> 2) EXCEPT ![Head(<<1, 2>>)] = Head(<<1>>)])[(Cardinality({2, 1, 3}) % Cardinality(2..1))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 172 to line 14, col 177 of module random_08768
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
