(*---
description: Evaluates a random bool expression, seed 262, number 2142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1]).a * IF FALSE THEN 7 ELSE 0) < ([a |-> 2147483647, b |-> FALSE]).a) \/ [[(<<5, 6>> @@ [x \in Nat |-> x + 1]) EXCEPT ![IF FALSE THEN 0 ELSE 1] = ([x \in 1..2 |-> x])[7]] EXCEPT ![(CHOOSE b3387 \in (0 .. 3) : (TRUE \/ FALSE))] = (CASE TRUE -> 1 [] OTHER -> 3 - Len(<<1, 2>>))]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
