(*---
description: Evaluates a random seq expression, seed 262, number 6855.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06855 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Append([(<<>> \o <<1, 2>>) EXCEPT ![1] = (FALSE).a], ([(1 :> 2) EXCEPT ![0] = 7])[(-3)]) \o [[<<2, 2147483647>> EXCEPT ![1] = Len(<<1, 2>>)] EXCEPT ![1] = ((<<5, 6>>)[3] % (-1 \div 3))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06855 failed.
    Attempted to select field "a" from a non-record value FALSE
    line 14, col 58 to line 14, col 66 of module random_06855
---*)
