(*---
description: Evaluates a random set expression, seed 262, number 7817.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07817 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((IF (\E b12067 \in {2, 1, 3} : TRUE) THEN CASE TRUE -> -1 [] OTHER -> 3 ELSE IF TRUE THEN 2 ELSE 1 + (CHOOSE b12068 \in (1..3 \ {2, 1, 3}) : (SUBSET {1} = {1, 2}))) .. Len(SelectSeq(SubSeq(<<>>, 7, 2), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1..0"
---*)
