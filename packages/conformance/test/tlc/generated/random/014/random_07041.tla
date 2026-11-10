(*---
description: Evaluates a random int expression, seed 262, number 7041.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07041 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10794 \in (((<<3, 1, 2>> = <<5, 6>>) \/ (TRUE => FALSE)) \/ ((-1 < 7) /\ (\E b10795 \in {2, 1, 3} : TRUE))) |-> (LET b10796 == (<<1, 2>> \o <<1>>) IN LET b10797 == {1} IN b10794 * CASE (TRUE \/ FALSE) -> (CHOOSE b10798 \in Nat : TRUE) [] OTHER -> ([a |-> 1, b |-> TRUE]).a)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b10794 \\in TRUE |-> <expression line 14, col 131 to line 14, col 289 of module random_07041>]"
---*)
