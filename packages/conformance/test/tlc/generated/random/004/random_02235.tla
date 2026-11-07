(*---
description: Evaluates a random function expression, seed 262, number 2235.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02235 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3511 \in DOMAIN (Len(<<1>>) :> (1 - -1)) |-> LET b3512 == ([[a |-> 1] EXCEPT !.a = @ + -1]).a IN IF ({1} = {x \in 1..3 : x > 1}) THEN ([a |-> 1]).a ELSE (b3511 + b3511)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
