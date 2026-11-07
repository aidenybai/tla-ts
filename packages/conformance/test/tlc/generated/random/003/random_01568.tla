(*---
description: Evaluates a random set expression, seed 262, number 1568.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01568 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({b2507 \in {(2147483647 * 7), (0 * 2)} : ({<<3, 1, 2>> : b2508 \in {}} = (b2507 .. 1))} \cup ((CHOOSE b2509 \in DOMAIN (1 :> 2) : (b2509 \in 2..1)) .. (([a |-> 1]).a * (-1 - 7)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*7
    2178:0 Overflow when computing 2147483647*7
---*)
