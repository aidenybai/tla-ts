(*---
description: Evaluates a random set expression, seed 262, number 6954.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06954 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF ((7 \in {}) => (FALSE => FALSE)) THEN (-CASE TRUE -> -1 [] OTHER -> 0) ELSE (((1 :> 2))[1] :> IF FALSE THEN 1 ELSE 3), (-Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-3, 1}"
---*)
