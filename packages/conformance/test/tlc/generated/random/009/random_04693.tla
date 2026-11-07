(*---
description: Evaluates a random int expression, seed 262, number 4693.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04693 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(({IF TRUE THEN [x \in 1..2 |-> x] ELSE b7335 : b7335 \in {b7336 \in {x \in 1..3 : x > 1} : TRUE}} \ ((<<5, 6>> @@ (1 :> 2)) @@ [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 2147483647]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
