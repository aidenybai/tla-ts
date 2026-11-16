(*---
description: Evaluates a random set expression, seed 262, number 9837.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09837 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((\A b15271 \in SUBSET {1} : TRUE) % Len(<<1, 2>>)) \div SubSeq(SelectSeq([x \in Nat |-> x + 1], LAMBDA e : e > 0), Len([x \in 1..2 |-> x]), (CHOOSE b15272 \in {x \in 1..3 : x > 1} : [a |-> 1]))) : b15270 \in {b15273 \in (IF FALSE THEN [x \in 1..2 |-> x] ELSE 2 .. LET b15274 == 7 IN b15274) : (\A b15275 \in ((1 :> 2))[b15273] : ({x \in 1..3 : x > 1} \subseteq {2, 1, 3}))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09837 failed.
    Attempted to apply function:
    <<2>>
    to argument 2, which is not in the domain of the function.
---*)
