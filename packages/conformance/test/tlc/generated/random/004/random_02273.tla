(*---
description: Evaluates a random set expression, seed 262, number 2273.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02273 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3587 \in (([a |-> TRUE, b |-> TRUE] \cap (SUBSET {1} \cup 2..1)) \cup {(1 + 7) : b3588 \in (1 .. 7)}) |-> ([b3589 \in DOMAIN (1 :> 2) |-> Cardinality(2..1)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b3587 \\in {8} \\cup [a |-> TRUE, b |-> TRUE] \\cap {{}, {1}} |-> <expression line 14, col 124 to line 14, col 176 of module random_02273>]"
---*)
