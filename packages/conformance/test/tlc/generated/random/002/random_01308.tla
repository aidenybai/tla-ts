(*---
description: Evaluates a random function expression, seed 262, number 1308.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01308 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b2078 \in ({b2079 \in ({1} \ Nat) : (2147483647 \in {1, 2})} \ (({1} \cup {1}) \cap ({} \cup {x \in 1..3 : x > 1}))) |-> (CHOOSE b2080 \in {(CHOOSE b2081 \in Nat : FALSE), (CHOOSE b2082 \in {1, 2} : TRUE)} : (SubSeq(<<>>, b2078, 2147483647) = (CHOOSE f \in [1..2 -> {1}] : TRUE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
