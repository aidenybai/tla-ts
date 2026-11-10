(*---
description: Evaluates a random function expression, seed 262, number 7553.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07553 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11633 \in UNION {({1 : b11634 \in {1, 2}} \cap (1 .. 3)), ((2 .. -1) \cup DOMAIN <<5, 6>>)} |-> (((-3) % (-b11633)) % (-(2147483647 - b11633)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b11633 \\in {1, 2} |-> <expression line 14, col 115 to line 14, col 159 of module random_07553>]"
---*)
