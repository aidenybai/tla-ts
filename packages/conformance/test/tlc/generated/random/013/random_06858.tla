(*---
description: Evaluates a random int expression, seed 262, number 6858.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06858 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CASE TRUE -> -1 [] OTHER -> 1 * ([x \in 1..2 |-> x])[0]) \div Len(SubSeq(<<>>, 0, 2))) + CASE (DOMAIN (1 :> 2) \/ ([a |-> 1, b |-> TRUE] <=> TRUE)) -> CASE (\E b10514 \in 1..3 : FALSE) -> (-2147483647) [] OTHER -> ([a |-> 1]).a [] OTHER -> ((\E b10515 \in 1..3 : TRUE) <=> (Nat \subseteq 1..3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<>>
    , but instead it is
    0
---*)
