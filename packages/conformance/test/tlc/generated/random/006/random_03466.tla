(*---
description: Evaluates a random int expression, seed 262, number 3466.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03466 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Tail((TRUE \o <<3, 1, 2>>))) \in {((3 :> 0))[CASE TRUE -> 2 [] OTHER -> 3], ((2 * FALSE) - (-2))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    TRUE
    2182:0 Evaluating an expression of the form s \o t when s is not a sequence:
    TRUE
---*)
