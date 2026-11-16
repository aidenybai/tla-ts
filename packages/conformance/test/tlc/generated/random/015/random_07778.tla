(*---
description: Evaluates a random int expression, seed 262, number 7778.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07778 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (\A b11995 \in {LET b11997 == 3 IN 1 : b11996 \in (CHOOSE f \in [{0} \cup {1} -> {}] : TRUE)} : ([a |-> 3, b |-> FALSE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b11995])) THEN {((b11998 * 7) \div (1 % 3)) : b11998 \in ((2..1 \cup 1..3) \ (3 .. 2147483647))} ELSE IF ((1..3 \ {x \in 1..3 : x > 1}) = {1, 0}) THEN (CHOOSE b11999 \in (SUBSET {1} \ 2..1) : (\A b12000 \in {1} : FALSE)) ELSE Len([<<1, 2>> EXCEPT ![1] = 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07778 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 70 to line 14, col 109 of module random_07778
---*)
