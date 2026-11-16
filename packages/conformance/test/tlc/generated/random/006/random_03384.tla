(*---
description: Evaluates a random seq expression, seed 262, number 3384.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03384 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(Tail((Tail(<<3, 1, 2>>) \o <<0, -1>>)), LET b5376 == LET b5377 == ([a |-> 1]).a IN (2 + b5377) IN IF (b5376 = b5376) THEN (2 * 0) ELSE (<<5, 6>>)[7]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 0, -1, 0>>"
---*)
