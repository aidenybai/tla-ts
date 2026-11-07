(*---
description: Evaluates a random seq expression, seed 262, number 7857.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07857 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE (Len(<<1, 2>>) < LET b12136 == -1 IN b12136) -> (CASE FALSE -> 2147483647 [] OTHER -> 2 - IF TRUE THEN 2 ELSE 2) [] OTHER -> IF (TRUE => TRUE) THEN CASE TRUE -> 7 [] OTHER -> 1 ELSE CASE TRUE -> -1 [] OTHER -> 1, (((CHOOSE r \in [a : 1..2] : TRUE) = [[a |-> 1] EXCEPT !.a = @ + 2]) \o <<(-3), (7 * 2)>>)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    FALSE
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    FALSE
---*)
