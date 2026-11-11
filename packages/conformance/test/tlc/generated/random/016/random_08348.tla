(*---
description: Evaluates a random function expression, seed 262, number 8348.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08348 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([Append((<<3, 1, 2>> \o <<3, 1, 2>>), (-3)) EXCEPT ![1] = (CASE TRUE -> 0 [] OTHER -> -1 * (2147483647 % 2147483647))] \o (SubSeq((<<1, 2>> \o <<1>>), (1 + 2147483647), ((1 :> 2))[2147483647]) \o Tail(SelectSeq(<<1>>, LAMBDA e : e > 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08348 failed.
    2178:0 Overflow when computing 1+2147483647
---*)
