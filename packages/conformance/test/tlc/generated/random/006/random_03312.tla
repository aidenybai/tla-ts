(*---
description: Evaluates a random seq expression, seed 262, number 3312.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03312 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(Tail([<<1>> EXCEPT ![1] = -1]), LAMBDA e : e > 0) EXCEPT ![1] = CASE (((1 :> 2))[7] <=> (\E b5262 \in {2, 1, 3} : [a |-> 1])) -> Cardinality(DOMAIN <<5, 6>>) [] OTHER -> ((CHOOSE b5263 \in SUBSET {1} : [x \in Nat |-> x + 1]) * (3 * 2147483647))])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 17 to line 14, col 75 of module random_03312
    | <<>>
---*)
