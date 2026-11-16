(*---
description: Evaluates a random seq expression, seed 262, number 4192.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04192 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([<<IF TRUE THEN 7 ELSE <<1>>, Head(<<3, 1, 2>>)>> EXCEPT ![1] = CASE (\A b6598 \in SUBSET {1} : TRUE) -> (0 - -1) [] OTHER -> (FALSE /\ TRUE)], Append(<<Len(<<>>), (2 % 2)>>, Len(Append(<<3, 1, 2>>, 0)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 3, <<0, 0, 4>>>>"
---*)
