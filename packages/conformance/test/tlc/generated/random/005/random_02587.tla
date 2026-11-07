(*---
description: Evaluates a random record expression, seed 262, number 2587.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02587 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> Head(SubSeq(<<1, 2>>, 2147483647, 7)), b |-> (DOMAIN (1 :> 2) = (CHOOSE f \in [{} -> {2, 1, 3}] : TRUE))] EXCEPT !.a = @ + (((CHOOSE r \in [a : 2..1] : TRUE)).a - Len(Tail(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
