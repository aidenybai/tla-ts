(*---
description: Evaluates a random function expression, seed 262, number 9337.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09337 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b14485 \in {(Head(<<>>) \div CASE FALSE -> b14486 [] OTHER -> 2147483647) : b14486 \in ({b14487 \in {x \in 1..3 : x > 1} : FALSE} \ {b14488 \in 1..3 : TRUE})} |-> Head(SubSeq(Tail(<<3, 1, 2>>), CASE TRUE -> b14485 [] OTHER -> 1, (CHOOSE b14489 \in 2..1 : FALSE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
