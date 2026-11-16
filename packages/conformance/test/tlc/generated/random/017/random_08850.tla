(*---
description: Evaluates a random function expression, seed 262, number 8850.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08850 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13706 \in UNION {UNION {(-1 .. 7), {b13707 : b13707 \in 2..1}}, UNION {{1 : b13708 \in SUBSET {1}}, (1..3 \cap {1, 2})}} |-> (CHOOSE b13709 \in {(b13706 - b13706), (CHOOSE b13710 \in {2, 1, 3} : TRUE)} : ((TRUE \/ [a |-> 1, b |-> TRUE]) /\ (TRUE => 7)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b13706 \\in {-1, 0, 1, 2, 3, 4, 5, 6, 7} |-> <expression line 14, col 144 to line 14, col 269 of module random_08850>]"
---*)
