(*---
description: Evaluates a random bool expression, seed 262, number 4945.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04945 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CASE (\A b7690 \in TRUE : TRUE) -> LET b7691 == 3 IN 7 [] OTHER -> CASE TRUE -> -1 [] OTHER -> -1 % (-(2147483647 * [a |-> 1]))) < IF ((\A b7692 \in SUBSET {1} : TRUE) => UNION {{2, 1, 3}, {1, 2}}) THEN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]).a ELSE (CHOOSE b7693 \in (2..1 \ 1..3) : (1..3 = {2, 1, 3}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04945 failed.
    TLC encountered a non-enumerable quantifier bound
    TRUE.
    line 14, col 37 to line 14, col 40 of module random_04945
---*)
