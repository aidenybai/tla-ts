(*---
description: Evaluates a random function expression, seed 262, number 6570.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06570 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10090 \in {b10091 \in {b10092 \in DOMAIN [x \in Nat |-> x + 1] : (<<3, 1, 2>> = (1 :> 2))} : ((TRUE \/ FALSE) /\ (TRUE \/ TRUE))} |-> ([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = Head(<<1>>)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b10090 \\in {b10091 \\in {b10092 \\in Nat : <expression line 14, col 84 to line 14, col 105 of module random_06570> } : <expression line 14, col 112 to line 14, col 144 of module random_06570> } |-> <expression line 14, col 152 to line 14, col 222 of module random_06570>]"
---*)
