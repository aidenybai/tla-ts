(*---
description: Evaluates a random int expression, seed 262, number 4250.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04250 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((({b6684 \in {1} : TRUE} \cup (-1 .. 7)) \ {([x \in Nat |-> x + 1])[2147483647], (7 \div 2)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
