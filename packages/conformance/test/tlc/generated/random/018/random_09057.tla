(*---
description: Evaluates a random int expression, seed 262, number 9057.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09057 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) = [(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + CASE FALSE -> 3 [] OTHER -> 7]) THEN ([[<<5, 6>> EXCEPT !.a = 3] EXCEPT !.a = CASE FALSE -> [a |-> 1, b |-> TRUE] [] OTHER -> 3]).a ELSE (IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN CASE TRUE -> <<1, 2>> [] OTHER -> 1 ELSE SubSeq(<<>>, 0, [x \in 1..2 |-> x]) \div Head((<<1>> \o <<3, 1, 2>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
    2169:0 The third argument of SubSeq should be a natural number, but instead it is:
    <<1, 2>>
---*)
