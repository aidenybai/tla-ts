(*---
description: Evaluates a random set expression, seed 262, number 6862.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06862 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((-(2 % 3)) % LET b10524 == (b10523 .. 2) IN (b10524 % b10523)) : b10523 \in (({b10525 \in {} : <<1>>} \ ([a |-> 1, b |-> TRUE]).a) \ ((7 .. 1) \cup (1..3 \ 2..1)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
