(*---
description: Evaluates a random int expression, seed 262, number 6530.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06530 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b10034 == Cardinality([(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = (--1)]) IN ((Len(<<>>) - (-1 * 2)) + LET b10035 == ([x \in 1..2 |-> x])[-1] IN Len(<<1>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 90 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | Except Spec starting at line 14, column 81.
    | Some [] Form starting at line 14, column 42.
    | ExtendableExpr starting at line 14, column 42.
    | Fatal errors while parsing TLA+ spec in file random_06530
    | In module random_06530
    | Could not parse module random_06530 from file random_06530.tla
    | *** Errors: 1
    | In module random_06530
    | Could not parse module random_06530 from file random_06530.tla
    3002:1 Parsing or semantic analysis failed.
---*)
