(*---
description: Evaluates a random set expression, seed 262, number 2760.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02760 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((CASE FALSE -> 7 [] OTHER -> 0 :> ([a |-> 1, b |-> TRUE]).a))[Head(SelectSeq(<<>>, LAMBDA e : e > 0))], ((~(TRUE \/ [x \in Nat |-> x + 1])) \/ (Head(<<1>>) = LET b4352 == 1 IN <<3, 1, 2>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
