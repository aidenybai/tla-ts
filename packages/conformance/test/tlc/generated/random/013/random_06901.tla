(*---
description: Evaluates a random function expression, seed 262, number 6901.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06901 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ({7 : b10569 \in 2..1} \subseteq (3 .. 7)) -> (([x \in 1..2 |-> x])[1] - ([a |-> 1, b |-> TRUE]).a) [] OTHER -> ((FALSE \o <<>>) % CASE FALSE -> 1 [] OTHER -> 0) :> (IF ({2, 1, 3} \subseteq 1..3) THEN Len(<<1>>) ELSE Len(<<1, 2>>) % (CHOOSE b10570 \in UNION {Nat, Nat} : (SUBSET {1} \subseteq {1, 2})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
