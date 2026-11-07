(*---
description: Evaluates a random function expression, seed 262, number 2671.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02671 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((([x \in Nat |-> x + 1])[2147483647] :> LET b4218 == 7 IN b4218) @@ (LET b4219 == 7 IN 2147483647 :> SubSeq(<<3, 1, 2>>, 2147483647, 1))) EXCEPT ![([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = Len(<<3, 1, 2>>)] + CASE ([a |-> 1, b |-> TRUE] .. 1) -> CASE FALSE -> 7 [] OTHER -> 2 [] OTHER -> ([a |-> 1, b |-> TRUE]).a)] = (-(LET b4220 == 3 IN b4220 \div (CHOOSE f \in [{2, 1, 3} -> {0} \cup {1}] : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+1
    2178:0 Overflow when computing 2147483647+1
---*)
