(*---
description: Evaluates a random function expression, seed 262, number 1748.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01748 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Len(Append([a |-> 1], 3)) \div ((-3) - CASE FALSE -> 2 [] OTHER -> 2147483647)) :> (SelectSeq((<<1, 2>> \o <<>>), LAMBDA e : e > 0)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1]
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    [a |-> 1]
---*)
