(*---
description: Evaluates a random seq expression, seed 262, number 5396.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05396 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Head(<<(1 \div 7), Len(<<>>)>>), (CASE (TRUE /\ TRUE) -> CASE TRUE -> 0 [] OTHER -> TRUE [] OTHER -> (3 - 0) - Len((<<1, 2>> \o <<3, 1, 2>>)))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 0>>"
---*)
