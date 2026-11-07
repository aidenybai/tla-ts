(*---
description: Evaluates a random seq expression, seed 262, number 2715.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02715 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(Append((CASE TRUE -> 2 [] OTHER -> 2 * (CHOOSE b4293 \in Nat : {1})), Head(<<1, <<3, 1, 2>>>>)), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    2
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    2
---*)
