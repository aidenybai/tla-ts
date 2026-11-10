(*---
description: Evaluates a random function expression, seed 262, number 2947.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02947 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[(([a |-> 1, b |-> TRUE]).a :> {7, 3}) EXCEPT ![IF (\A b4671 \in <<1, 2>> : TRUE) THEN ((1 :> 2) = {1, 2}) ELSE LET b4672 == 2147483647 IN 7] = (LET b4673 == 7 IN 2147483647 \div IF (1 :> 2) THEN 7 ELSE 1)] EXCEPT ![(CASE (3 < TRUE) -> (0)[2147483647] [] OTHER -> Len(<<1>>) \div Head(SubSeq(<<3, 1, 2>>, 3, 2)))] = (CHOOSE b4674 \in {Len(<<>>) : b4675 \in ((1 :> 2) @@ (1 :> 2))} : ((b4674 = 3) <=> (FALSE <=> TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02947 failed.
    TLC encountered a non-enumerable quantifier bound
    <<1, 2>>.
    line 14, col 82 to line 14, col 89 of module random_02947
---*)
