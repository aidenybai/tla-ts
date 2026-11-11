(*---
description: Evaluates a random seq expression, seed 262, number 6842.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06842 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(Tail(SubSeq(IF FALSE THEN -1 ELSE 3, (0 * 7), (FALSE)[7])), (((<<5, 6>> @@ [x \in 1..2 |-> x]) @@ (CHOOSE f \in [2..1 -> 2..1] : TRUE)))[(IF TRUE THEN 2147483647 ELSE 2147483647 % (7 % 1))], (CASE (<<3, 1, 2>> = [x \in Nat |-> x + 1]) -> Len(<<3, 1, 2>>) [] OTHER -> Len(<<1, 2>>) * ([[x \in 1..2 |-> x] EXCEPT ![-1] = 0])[(2 \div 2147483647)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06842 failed.
    A non-function (a Boolean value) was applied as a function.
    line 14, col 69 to line 14, col 78 of module random_06842
---*)
