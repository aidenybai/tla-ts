(*---
description: Evaluates a random int expression, seed 262, number 7131.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07131 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b10948 == CASE (Tail(<<>>) = [[x \in Nat |-> x + 1] EXCEPT ![2] = FALSE]) -> ((CHOOSE r \in [a : {}] : TRUE)).a [] OTHER -> LET b10949 == (CHOOSE b10950 \in {x \in 1..3 : x > 1} : FALSE) IN ([x \in Nat |-> x + 1]).a IN [([a |-> b10948, b |-> TRUE] :> IF TRUE THEN -1 ELSE -1) EXCEPT ![LET b10951 == (b10948 \in {1}) IN (7 % b10951)] = LET b10952 == (b10948 \div 2) IN (CHOOSE b10953 \in {} : b10952)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07131 failed.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
