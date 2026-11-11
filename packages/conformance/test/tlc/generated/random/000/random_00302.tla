(*---
description: Evaluates a random record expression, seed 262, number 302.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00302 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(\E b501 \in {IF TRUE THEN 2 ELSE <<1, 2>>, CASE FALSE -> 2 [] OTHER -> 3} : ((<<1, 2>> = <<3, 1, 2>>) => (~TRUE))) EXCEPT !.a = @ + ((Head(<<3, 1, 2>>) - (-0)) % Head(Append(<<3, 1, 2>>, 2)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00302 failed.
    Attempted to apply EXCEPT construct to the value TRUE.
---*)
