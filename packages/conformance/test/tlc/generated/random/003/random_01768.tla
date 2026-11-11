(*---
description: Evaluates a random seq expression, seed 262, number 1768.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01768 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<UNION {(-1 .. 2147483647), {1 : b2809 \in {2, 1, 3}}}, Cardinality(DOMAIN (1 :> 2))>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
