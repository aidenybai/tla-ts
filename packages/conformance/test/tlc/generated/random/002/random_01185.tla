(*---
description: Evaluates a random seq expression, seed 262, number 1185.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01185 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SelectSeq(<<CASE FALSE -> 0 [] OTHER -> 3, ([a |-> 1]).a>>, LAMBDA e : e > 0) EXCEPT ![1] = IF (({2, 1, 3} \ 1..3) \subseteq DOMAIN [x \in 1..2 |-> x]) THEN (Cardinality({}) % (2147483647 % 2)) ELSE CASE (FALSE /\ 0) -> (-1 \div 3) [] OTHER -> IF TRUE THEN 7 ELSE 0])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<0, 1>>"
---*)
