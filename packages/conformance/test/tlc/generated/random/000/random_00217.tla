(*---
description: Evaluates a random function expression, seed 262, number 217.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00217 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b351 \in {b352 \in (Append(<<1, 2>>, -1) \ (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)) : (Cardinality(SUBSET {1}) \in {b353 \in {2, 1, 3} : FALSE})} |-> CASE ((FALSE /\ FALSE) <=> (TRUE /\ b351)) -> ([b354 \in {1} |-> 1])[Head([x \in Nat |-> x + 1])] [] OTHER -> IF (2 \in TRUE) THEN (2 + <<3, 1, 2>>) ELSE CASE FALSE -> b351 [] OTHER -> 2])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [b351 \\in {b352 \\in <<1, 2, -1>> \\ [a |-> 2] : <expression line 14, col 108 to line 14, col 163 of module random_00217> } |-> <expression line 14, col 171 to line 14, col 356 of module random_00217>]"
---*)
