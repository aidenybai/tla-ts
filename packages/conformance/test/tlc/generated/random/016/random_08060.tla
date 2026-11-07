(*---
description: Evaluates a random seq expression, seed 262, number 8060.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08060 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(UNION {(<<5, 6>> \cup Nat), DOMAIN (1 :> 2)} \ {(-b12451) : b12451 \in (2147483647 .. 3)}), {CASE DOMAIN [x \in Nat |-> x + 1] -> CASE FALSE -> 7 [] OTHER -> 7 [] OTHER -> (3 * [a |-> 1]), Cardinality(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08060 failed.
    A non-boolean expression (a special set constant) was used as a condition of a CASE. line 14, col 122 to line 14, col 149 of module random_08060
---*)
