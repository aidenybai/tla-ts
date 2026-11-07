(*---
description: Evaluates a random seq expression, seed 262, number 3439.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03439 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(<<(0 % 3), (2 - 3)>>, Head([<<3, 1, 2>> EXCEPT ![1] = 2147483647]), IF (FALSE \/ FALSE) THEN ((1 :> 2))[2147483647] ELSE Cardinality(<<1>>)), (~((SUBSET {1} \ Nat) \subseteq ([x \in 1..2 |-> x] \cap 2..1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2181:0 Attempted to compute cardinality of the value
    <<1>>
    2181:0 Attempted to compute cardinality of the value
    <<1>>
---*)
