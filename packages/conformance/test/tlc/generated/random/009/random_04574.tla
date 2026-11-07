(*---
description: Evaluates a random seq expression, seed 262, number 4574.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04574 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(SubSeq(Tail(<<>>), CASE TRUE -> 7 [] OTHER -> 1, (CHOOSE b7177 \in {x \in 1..3 : x > 1} : TRUE)), LAMBDA e : e > 0) EXCEPT ![1] = Len((CHOOSE f \in [{} -> {1, 2} \ {1}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
