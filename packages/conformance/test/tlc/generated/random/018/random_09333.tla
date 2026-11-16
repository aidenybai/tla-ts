(*---
description: Evaluates a random set expression, seed 262, number 9333.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09333 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {UNION {(LET b14479 == 0 IN 2147483647 .. IF TRUE THEN -1 ELSE 3), UNION {({} \cup {2, 1, 3}), DOMAIN <<5, 6>>}}, {CASE (FALSE /\ FALSE) -> LET b14480 == 2 IN b14480 [] OTHER -> (CHOOSE b14481 \in 1..3 : TRUE), ((-1 + 3) * CASE <<5, 6>> -> -1 [] OTHER -> 3)}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09333 failed.
    A non-boolean expression (a tuple) was used as a condition of a CASE. line 14, col 250 to line 14, col 257 of module random_09333
---*)
