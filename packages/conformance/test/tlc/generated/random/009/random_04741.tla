(*---
description: Evaluates a random seq expression, seed 262, number 4741.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04741 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<((3 + 7) = LET b7408 == 1 IN 0), ((CHOOSE b7409 \in {1} : TRUE) + CASE FALSE -> 7 [] OTHER -> 7)>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<8>>"
---*)
