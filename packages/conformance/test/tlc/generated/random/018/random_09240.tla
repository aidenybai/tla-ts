(*---
description: Evaluates a random function expression, seed 262, number 9240.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09240 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14340 \in {(CASE TRUE -> 1 [] OTHER -> b14341 :> (2147483647 * 2147483647)) : b14341 \in UNION {{b14342 \in 2..1 : TRUE}, ({2, 1, 3} \ 1..3)}} |-> CASE (Tail(<<1>>) = [b14343 \in 2..1 |-> b14340]) -> SubSeq(Tail(<<3, 1, 2>>), UNION {{1}, 1..3}, LET b14344 == 2147483647 IN 2147483647) [] OTHER -> ((2 - b14340) % (CHOOSE b14345 \in {2, 1, 3} : FALSE))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
