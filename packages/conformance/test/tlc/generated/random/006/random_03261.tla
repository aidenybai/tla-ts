(*---
description: Evaluates a random seq expression, seed 262, number 3261.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03261 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Append(SelectSeq(Tail(<<1>>), LAMBDA e : e > 0), CASE (FALSE <=> TRUE) -> LET b5192 == 0 IN b5192 [] OTHER -> CASE TRUE -> -1 [] OTHER -> 2147483647), IF ((~TRUE) <=> (2..1 = (1 :> 2))) THEN (([x \in 1..2 |-> x])[0])[(3 % -1)] ELSE CASE (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) -> (1 * 0) [] OTHER -> Len(<<1, 2>>), Cardinality(((0 .. -1) \cup ({2, 1, 3} \cup {1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03261 failed.
    Attempted to check equality of the set {} with the value:
    <<2>>
---*)
