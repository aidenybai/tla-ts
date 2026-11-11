(*---
description: Evaluates a random function expression, seed 262, number 7108.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07108 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10912 \in {b10913 \in {b10914 \in {7 : b10915 \in 2..1} : {b10916 \in 2..1 : <<1, 2>>}} : ({2, b10913} < Len(<<1, 2>>))} |-> IF ((b10912 - b10912) \in UNION {1..3, {1, 2}}) THEN (LET b10917 == b10912 IN 1 - Len(<<1>>)) ELSE Head(Append(<<1, 2>>, b10912))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
