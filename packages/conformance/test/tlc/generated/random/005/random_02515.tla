(*---
description: Evaluates a random function expression, seed 262, number 2515.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02515 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3966 \in UNION {DOMAIN [b3967 \in {1} |-> 2], {b3968 \in UNION {{x \in 1..3 : x > 1}, 1..3} : ([a |-> 1] = [a |-> 1])}} |-> [Tail(SelectSeq(<<>>, LAMBDA e : e > 0)) EXCEPT ![1] = CASE (TRUE \in 2..1) -> [<<1>> EXCEPT ![1] = b3966] [] OTHER -> (b3966 - b3966)]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b3966 \\in {1, 2, 3} |-> <expression line 14, col 142 to line 14, col 276 of module random_02515>]"
---*)
