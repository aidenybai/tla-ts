(*---
description: Evaluates a random record expression, seed 262, number 2935.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02935 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> -1, b |-> FALSE] EXCEPT !.a = Len(2147483647)] EXCEPT !.a = (CHOOSE b4645 \in (2147483647 .. 0) : (1 = b4645))] EXCEPT !.a = (LET b4646 == (CHOOSE b4647 \in {x \in 1..3 : x > 1} : FALSE) IN Head(<<1>>) < CASE (1 < -1) -> (7 * 1) [] OTHER -> CASE FALSE -> 7 [] OTHER -> 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02935 failed.
    2283:0 The argument of Len should be a sequence, but instead it is:
    2147483647
---*)
