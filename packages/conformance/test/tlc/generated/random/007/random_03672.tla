(*---
description: Evaluates a random record expression, seed 262, number 3672.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03672 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (CHOOSE b5803 \in {1} : TRUE)] EXCEPT !.a = ((-1) .. Cardinality((1 :> 2)))] EXCEPT !.a = Head(((<<1>> = <<5, 6>>) \/ (FALSE /\ TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03672 failed.
    2181:0 Attempted to compute cardinality of the value
    <<2>>
---*)
