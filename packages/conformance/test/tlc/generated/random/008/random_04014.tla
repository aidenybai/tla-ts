(*---
description: Evaluates a random set expression, seed 262, number 4014.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04014 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b6302 \in DOMAIN (2147483647 :> 2) |-> ((1 \div 3) - (b6302 * b6302))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647*2147483647
    2178:0 Overflow when computing 2147483647*2147483647
---*)
