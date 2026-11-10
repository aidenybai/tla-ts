(*---
description: Evaluates a random seq expression, seed 262, number 7709.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07709 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(SelectSeq((<<1, 2>> \o <<3, 1, 2>>), LAMBDA e : e > 0), ((7 :> 1))[(7 * 2147483647)], ((7 * FALSE) \div (-1 \div 7))), (Head(Tail(<<1>>)) * ([a |-> 1, b |-> FALSE]).a), ((CHOOSE b11890 \in {b11891 \in SUBSET {1} : TRUE} : (FALSE \/ FALSE)) + (CASE TRUE -> FALSE [] OTHER -> 7 - IF TRUE THEN 7 ELSE 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07709 failed.
    2178:0 Overflow when computing 7*2147483647
---*)
