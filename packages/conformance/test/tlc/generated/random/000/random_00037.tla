(*---
description: Evaluates a random seq expression, seed 262, number 37.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00037 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((Append(Tail(<<1>>), (1 - -1)) \o <<IF TRUE THEN 2 ELSE 3, (-3)>>), (-([[a |-> 1] EXCEPT !.a = @ + 1]).a)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 2, -3, -2>>"
---*)
