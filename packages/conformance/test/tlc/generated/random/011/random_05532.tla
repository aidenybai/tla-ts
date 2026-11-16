(*---
description: Evaluates a random int expression, seed 262, number 5532.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05532 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF (({-1, 0} = {3, 7}) => (~(~TRUE))) THEN LET b8557 == (CHOOSE b8558 \in DOMAIN [x \in 1..2 |-> x] : (b8558 < 2)) IN (CHOOSE b8559 \in ({} \cup SUBSET {1}) : (\A b8560 \in {1} : TRUE)) ELSE (SubSeq(<<3, 7>>, Head(<<1, 2>>), [[a |-> 1] EXCEPT !.a = 3]) \o SelectSeq(SortSeq(<<>>, LAMBDA p, q : p < q), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
