(*---
description: Evaluates a random bool expression, seed 262, number 7411.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07411 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((Len(<<1>>) = IF FALSE THEN 2147483647 ELSE 0) /\ (LET b11419 == [a |-> 1] IN b11419 \in {b11420 \in {1, 2} : FALSE})) -> ((CHOOSE r \in [a : 2..1] : TRUE)).a [] OTHER -> SubSeq([b11421 \in ({1, 2} \ {}) |-> CASE TRUE -> 1 [] OTHER -> 2], ([a |-> 0, b |-> TRUE]).a, Head((<<1, 2>> \o <<>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 1>>
    , but instead it is
    0
    2183:0 The second argument of SubSeq must be in the domain of its first argument:
    <<1, 1>>
    , but instead it is
    0
---*)
