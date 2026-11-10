(*---
description: Evaluates a random set expression, seed 262, number 6475.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06475 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(([a |-> 1]).a - IF FALSE THEN 2147483647 ELSE 2147483647), IF [[a |-> 1] EXCEPT !.a = @ + 2] THEN (<<5, 6>>)[2] ELSE (2 - 0)} \ UNION {((<<1>> \o <<>>) \o [<<1, 2>> EXCEPT ![1] = 1]), {Head(<<1>>), Len(<<>>)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06475 failed.
    A non-boolean expression (a record) was used as the condition of an IF.
    line 14, col 78 to line 14, col 142 of module random_06475
---*)
