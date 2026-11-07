(*---
description: Evaluates a random seq expression, seed 262, number 3278.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03278 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq((Tail(Tail(<<1>>)) \o (Tail(<<1, 2>>) \o <<-1, -1>>)), Cardinality(DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![3] = 2]), IF ((\A b5215 \in {2, 1, 3} : FALSE) => ({x \in 1..3 : x > 1} = {})) THEN Head([<<1, 2>> EXCEPT ![1] = 7]) ELSE (CHOOSE b5216 \in ({1} \ {}) : ([a |-> 1, b |-> TRUE] = [a |-> 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
