(*---
description: Evaluates a random record expression, seed 262, number 3816.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03816 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (\E b6016 \in (([a |-> 1]).a .. (-1)) : ({b6017 \in {1, 2} : FALSE} \subseteq {b6016, b6016})) -> Len((SubSeq(<<3, 1, 2>>, 0, 2) \o [<<5, 6>> EXCEPT ![-1] = 0])) [] OTHER -> ((-IF FALSE THEN 0 ELSE 1) + (CASE TRUE -> 2 [] OTHER -> 3 \div CASE TRUE -> -1 [] OTHER -> 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
