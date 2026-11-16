(*---
description: Evaluates a random record expression, seed 262, number 9070.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09070 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = (<<1>> = <<5, 6>>)] EXCEPT !.a = ((--1) % (-0))] EXCEPT !.a = @ + Len(Append(Append(<<>>, 2147483647), ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 108 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 105.
    | Expression starting at line 14, column 105.
    | ExtendableExpr starting at line 14, column 104.
    | Expression starting at line 14, column 104.
    | Except Spec starting at line 14, column 98.
    | Fatal errors while parsing TLA+ spec in file random_09070
    | In module random_09070
    | Could not parse module random_09070 from file random_09070.tla
    | *** Errors: 1
    | In module random_09070
    | Could not parse module random_09070 from file random_09070.tla
    3002:1 Parsing or semantic analysis failed.
---*)
