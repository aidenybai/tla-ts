(*---
description: Evaluates a random int expression, seed 262, number 815.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00815 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (CASE TRUE -> 2147483647 [] OTHER -> (1 :> 2) = Tail(<<1, 2>>)) THEN Cardinality({2147483647, 3}) ELSE IF {b1334 \in Nat : FALSE} THEN (2 + 0) ELSE Head(<<3, 1, 2>>) * LET b1335 == (Cardinality({x \in 1..3 : x > 1}))[({} \cup {1})] IN Head(<<-1, b1335>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00815 failed.
    A non-boolean expression (an integer) was used as the condition of an IF.
    line 14, col 17 to line 14, col 273 of module random_00815
---*)
