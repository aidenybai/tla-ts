(*---
description: Evaluates a random function expression, seed 262, number 6115.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06115 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((7 \div 2) * LET b9411 == 2147483647 IN b9411) - ((1 + 0) - ((1 :> 2))[1])) :> ((Len(<<1>>) :> Len(<<1, 2>>)))[((2147483647)[1] - CASE FALSE -> 0 [] OTHER -> 3)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 3*2147483647
    2178:0 Overflow when computing 3*2147483647
---*)
