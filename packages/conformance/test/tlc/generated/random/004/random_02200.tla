(*---
description: Evaluates a random set expression, seed 262, number 2200.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02200 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[a |-> -1, b |-> FALSE] EXCEPT !.a = (1 * 0)] EXCEPT !.a = @ + ((1..3 - 7)).a] .. LET b3459 == CASE (TRUE => FALSE) -> CASE TRUE -> 1 [] OTHER -> -1 [] OTHER -> Append(<<1, 2>>, 0) IN ((7 - TRUE) * (1 - 7))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02200 failed.
    Attempted to select field "a" from a non-record value {}
    line 14, col 82 to line 14, col 95 of module random_02200
---*)
