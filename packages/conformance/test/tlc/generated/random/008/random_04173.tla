(*---
description: Evaluates a random set expression, seed 262, number 4173.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04173 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b6563 \in DOMAIN (-1 :> 3) |-> Len((<<1>> \o <<1, 2>>))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {-1}"
---*)
