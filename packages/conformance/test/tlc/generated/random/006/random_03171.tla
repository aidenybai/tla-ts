(*---
description: Evaluates a random function expression, seed 262, number 3171.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03171 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5051 \in {IF (\A b5052 \in 2 : TRUE) THEN CASE FALSE -> 2147483647 [] OTHER -> 1 ELSE Head(<<>>), (-(-1 - 0))} : (~([<<>> EXCEPT ![1] = b5051] = DOMAIN (1 :> 2)))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03171 failed.
    TLC encountered a non-enumerable quantifier bound
    2.
    2
---*)
