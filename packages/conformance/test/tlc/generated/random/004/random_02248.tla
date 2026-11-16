(*---
description: Evaluates a random set expression, seed 262, number 2248.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02248 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = -1] EXCEPT !.a = (--1)] EXCEPT !.a = Len(<<<<>>, 3>>)] EXCEPT !.a = @ + (LET b3537 == LET b3538 == 0 IN 2147483647 IN (CHOOSE b3539 \in {1} : FALSE) \div SortSeq(SelectSeq(<<1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 63 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 60.
    | Expression starting at line 14, column 60.
    | Except Spec starting at line 14, column 54.
    | Some [] Form starting at line 14, column 18.
    | ExtendableExpr starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_02248
    | In module random_02248
    | Could not parse module random_02248 from file random_02248.tla
    | *** Errors: 1
    | In module random_02248
    | Could not parse module random_02248 from file random_02248.tla
    3002:1 Parsing or semantic analysis failed.
---*)
