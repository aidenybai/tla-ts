(*---
description: Evaluates a random function expression, seed 262, number 5122.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05122 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7967 \in ((({1, 2} \ {2, 1, 3}) \ (1..3 \cup {2, 1, 3})) \cup ((Nat \cup {2, 1, 3}) \cap (SUBSET {1} \cup {1}))) |-> Len([SubSeq(<<1>>, 7, 3) EXCEPT ![1] = (1 :> b7967)])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b7967 \\in {1, 2, 3} \\cup Nat \\cap {1} \\cup {{}, {1}} |-> <expression line 14, col 135 to line 14, col 187 of module random_05122>]"
---*)
