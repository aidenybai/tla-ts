(*---
description: Evaluates a random set expression, seed 262, number 5340.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05340 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b8256 \in (([[a |-> 1] EXCEPT !.a = 3]).a .. CASE ({} = {1}) -> (-2) [] OTHER -> (-1 - 0)) : (<<(b8256 - b8256), ([x \in Nat |-> x + 1])[b8256]>> = (([a |-> 1, b |-> TRUE]).a :> (<<5, 6>>)[b8256]))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
