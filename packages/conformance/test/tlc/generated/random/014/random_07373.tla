(*---
description: Evaluates a random function expression, seed 262, number 7373.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07373 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11351 \in {b11352 \in ({3, 3} \ (Nat \ {})) : (\E b11353 \in {-1 : b11354 \in {1}} : (<<1>> = 2))} |-> ((Head(<<1, 2>>) % (<<5, 6>>)[b11351]) + (CHOOSE b11355 \in (b11351 .. -1) : (TRUE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
