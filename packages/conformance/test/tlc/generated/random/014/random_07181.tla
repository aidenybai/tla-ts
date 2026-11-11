(*---
description: Evaluates a random int expression, seed 262, number 7181.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07181 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head((CHOOSE b11030 \in DOMAIN [x \in 1..2 |-> x] : (FALSE <=> TRUE))) \div CASE (\E b11031 \in UNION {2..1, {1}} : (\E b11032 \in SUBSET {1} : FALSE)) -> Len(Append(<<>>, [a |-> 1])) [] OTHER -> CASE (7 < 1) -> (CHOOSE r \in [a : {}] : TRUE) [] OTHER -> (FALSE)[7]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07181 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 23 to line 14, col 84 of module random_07181
---*)
