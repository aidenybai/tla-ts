(*---
description: Evaluates a random seq expression, seed 262, number 2386.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02386 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(CHOOSE b3785 \in (({1, 2} \cup {1, 2}) \cup UNION {{1}, 1..3}) : ({b3786 \in SUBSET {1} : FALSE} \subseteq ({1, 2} \ 2..1))), (CASE (-1 = -1) -> Len(<<3, 1, 2>>) [] OTHER -> Head(<<1, 2>>) - CASE (FALSE \/ FALSE) -> ({1, 2} \cup 2..1) [] OTHER -> (2 - 7))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 3>>"
---*)
