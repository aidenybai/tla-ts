(*---
description: Evaluates a random function expression, seed 262, number 5085.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05085 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b7913 \in (UNION {DOMAIN [x \in 1..2 |-> x], DOMAIN <<5, 6>>} \ ((2147483647 - 3) .. (-1 % 3))) |-> IF [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = (<<5, 6>>)[b7913]] THEN ((-0) * (3 .. <<>>)) ELSE (([a |-> 1]).a * (CHOOSE r \in [a : 2..1] : TRUE))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b7913 \\in {1, 2} |-> <expression line 14, col 117 to line 14, col 271 of module random_05085>]"
---*)
