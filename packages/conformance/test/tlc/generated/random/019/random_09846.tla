(*---
description: Evaluates a random int expression, seed 262, number 9846.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09846 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (({-1, 3} < (1..3 \cup Nat)) => ((TRUE <=> FALSE) <=> ([a |-> 1, b |-> TRUE] <=> FALSE))) -> (CHOOSE b15286 \in {CASE FALSE -> b15287 [] OTHER -> 2147483647 : b15287 \in (SUBSET {1} \ {x \in 1..3 : x > 1})} : ({2, 1} = UNION {{x \in 1..3 : x > 1}, 1..3})) [] OTHER -> LET b15288 == Cardinality([b15289 \in {1} |-> 2147483647]) IN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]).a)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    {-1, 3}
    2266:0 The first argument of < should be an integer, but instead it is:
    {-1, 3}
---*)
