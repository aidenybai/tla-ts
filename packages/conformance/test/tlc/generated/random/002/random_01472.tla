(*---
description: Evaluates a random int expression, seed 262, number 1472.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01472 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = Head(<<>>)] EXCEPT !.a = @ + Head(SelectSeq(<<1>>, LAMBDA e : e > 0))] EXCEPT !.a = IF ((2147483647 + 7) < (\A b2350 \in {x \in 1..3 : x > 1} : FALSE)) THEN IF (TRUE /\ FALSE) THEN LET b2351 == 0 IN b2351 ELSE IF TRUE THEN 0 ELSE 7 ELSE LET b2352 == CASE FALSE -> -1 [] OTHER -> -1 IN (b2352 * b2352)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01472 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 20 to line 14, col 49 of module random_01472
---*)
