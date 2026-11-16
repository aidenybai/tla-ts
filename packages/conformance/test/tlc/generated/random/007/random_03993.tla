(*---
description: Evaluates a random function expression, seed 262, number 3993.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03993 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6279 \in {b6280 \in {b6281 \in UNION {{2, 1, 3}, 1..3} : (FALSE => TRUE)} : ((2 \in SUBSET {1}) <=> (b6280 \in {1, 2}))} |-> Len(({2147483647 : b6282 \in {}} \cup (SUBSET {1} \ [x \in 1..2 |-> x])))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b6279 \\in {b6280 \\in {1, 2, 3} : <expression line 14, col 95 to line 14, col 135 of module random_03993> } |-> <expression line 14, col 143 to line 14, col 215 of module random_03993>]"
---*)
