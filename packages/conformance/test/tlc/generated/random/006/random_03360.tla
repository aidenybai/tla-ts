(*---
description: Evaluates a random set expression, seed 262, number 3360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b5337 \in {b5338 \in DOMAIN <<5, 6>> : (2..1 \subseteq {1, 2})} |-> CASE (TRUE /\ FALSE) -> (7 - b5337) [] OTHER -> Len(<<3, 1, 2>>)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
