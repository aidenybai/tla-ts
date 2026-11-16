(*---
description: Evaluates a random record expression, seed 262, number 3448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (7 = 3) -> (3 * 7) [] OTHER -> (2 \div 1), b |-> ((1 < 3) => (3 \in {1}))] EXCEPT !.a = ([b5466 \in UNION {1..3, 1..3} |-> (b5466 + b5466)])[(([a |-> 1, b |-> TRUE]).a + Len(<<1>>))]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 4, b |-> FALSE]"
---*)
