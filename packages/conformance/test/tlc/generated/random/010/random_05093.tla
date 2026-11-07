(*---
description: Evaluates a random set expression, seed 262, number 5093.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05093 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {{Cardinality(<<2, b7918>>) : b7918 \in DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 2147483647]}, {(-[(1 :> 2) EXCEPT ![b7919] = -1]) : b7919 \in ({b7920 \in FALSE : TRUE} \ {b7921 : b7921 \in 2..1})}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
