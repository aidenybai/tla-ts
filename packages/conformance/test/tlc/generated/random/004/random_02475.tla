(*---
description: Evaluates a random seq expression, seed 262, number 2475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq((((CHOOSE b3890 \in {1, 2} : TRUE) < (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2}] : TRUE)) /\ ((0 = 2) => [<<5, 6>> EXCEPT ![0] = 7])), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    (2 :> 1)
    2266:0 The second argument of < should be an integer, but instead it is:
    (2 :> 1)
---*)
