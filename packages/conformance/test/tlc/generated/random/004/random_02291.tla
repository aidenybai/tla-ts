(*---
description: Evaluates a random set expression, seed 262, number 2291.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02291 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (LET b3616 == IF FALSE THEN -1 ELSE 2 IN CASE FALSE -> b3616 [] OTHER -> b3616 :> ((\E b3617 \in {x \in 1..3 : x > 1} : b3617) - (7 \div 2147483647))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 107 to line 14, col 147 of module random_02291
    2215:0 TLC expected a boolean value, but did not find one. line 14, col 107 to line 14, col 147 of module random_02291
---*)
