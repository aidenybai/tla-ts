(*---
description: Evaluates a random int expression, seed 262, number 1857.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01857 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (Head(Tail(<<1>>)) = (CHOOSE b2929 \in (7 :> 7) : (\A b2930 \in {x \in 1..3 : x > 1} : FALSE))) -> (((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a - Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))) [] OTHER -> (-Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
