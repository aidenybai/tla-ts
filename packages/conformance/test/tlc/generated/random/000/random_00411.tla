(*---
description: Evaluates a random function expression, seed 262, number 411.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00411 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b671 \in (SelectSeq(Tail(<<1>>), LAMBDA e : e > 0) \o Append(<<3, 3>>, (3 % 1))) |-> CASE (DOMAIN <<5, 6>> \subseteq (b671 \ 2..1)) -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = b671]).a [] OTHER -> ((-1 \div b671) - (FALSE => TRUE))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b671 \\in <<3, 3, 0>> |-> <expression line 14, col 102 to line 14, col 243 of module random_00411>]"
---*)
