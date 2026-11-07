(*---
description: Evaluates a random record expression, seed 262, number 7650.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07650 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([[[[x \in Nat |-> x + 1] EXCEPT ![7] = 3] EXCEPT ![1] = CASE TRUE -> 7 [] OTHER -> 1] EXCEPT ![1] = ((CHOOSE b11774 \in {1, 2} : TRUE) \div ([a |-> 1]).a)], Len(SubSeq((<<1, 2>> \o <<1>>), Head(<<>>), Len(<<1>>))), Head(SubSeq(<<-1, 2>>, ((1 :> 2))[3], (0 * 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
