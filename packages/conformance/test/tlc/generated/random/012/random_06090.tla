(*---
description: Evaluates a random int expression, seed 262, number 6090.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06090 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(Len((<<1, 2>> \o <<3, 1, 2>>)) - CASE (FALSE => TRUE) -> ([a |-> 1, b |-> TRUE]).a [] OTHER -> LET b9375 == 0 IN b9375)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -4"
---*)
