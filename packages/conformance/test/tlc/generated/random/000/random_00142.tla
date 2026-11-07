(*---
description: Evaluates a random seq expression, seed 262, number 142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(([[a |-> 1] EXCEPT !.a = 0]).a % (CASE TRUE -> 7 [] OTHER -> -1 * ([a |-> 1, b |-> TRUE]).a)), (((FALSE)[1] :> (2147483647 - 3)))[LET b223 == IF [a |-> 1, b |-> TRUE] THEN 1 ELSE 7 IN Head(<<>>)]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00142 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 116 to line 14, col 125 of module random_00142
---*)
