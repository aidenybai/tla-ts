(*---
description: Evaluates a random bool expression, seed 262, number 9001.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09001 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Tail((1 :> 2))) .. ((1 % 2147483647) + CASE FALSE -> 1 [] OTHER -> 7)) = {([FALSE EXCEPT ![2147483647] = 0])[Len(<<>>)], CASE (TRUE \/ FALSE) -> Head(<<>>) [] OTHER -> (<<5, 6>>)[{2, 1, 3}]}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
