(*---
description: Evaluates a random function expression, seed 262, number 8318.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08318 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b12872 \in {b12873 \in DOMAIN (3 :> [x \in Nat |-> x + 1]) : (Head(<<1>>) < ([a |-> 1, b |-> TRUE]).a)} |-> ([[[a |-> 1] EXCEPT !.a = 2] EXCEPT !.a = @ + ([a |-> 1]).a])[((<<5, 6>>)[3] - (2 % b12872))]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
