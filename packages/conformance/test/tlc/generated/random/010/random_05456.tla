(*---
description: Evaluates a random int expression, seed 262, number 5456.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05456 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = 3] EXCEPT !.a = @ + Append(FALSE, -1)] EXCEPT !.a = (Cardinality(SUBSET {1}) * ([a |-> 1, b |-> TRUE]).a)] % Len(SelectSeq((<<1>> \o <<1>>), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05456 failed.
    2182:0 Evaluating an expression of the form Append(s, v) when s is not a sequence:
    FALSE
---*)
