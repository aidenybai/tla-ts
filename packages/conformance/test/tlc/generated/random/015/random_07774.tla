(*---
description: Evaluates a random int expression, seed 262, number 7774.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07774 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SubSeq(Tail(<<3, 1, 2>>), (<<5, 6>>)[1], ([a |-> 1, b |-> TRUE]).a)) :> CASE (~(3 = 3)) -> (Head(TRUE) :> (2..1 \ <<3, 1, 2>>)) [] OTHER -> IF (\A b11993 \in {2, 1, 3} : [a |-> 1]) THEN (Nat \cup {x \in 1..3 : x > 1}) ELSE (-1 - 7)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 165 to line 14, col 199 of module random_07774
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 165 to line 14, col 199 of module random_07774
---*)
