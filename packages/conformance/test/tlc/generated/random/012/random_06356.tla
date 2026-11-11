(*---
description: Evaluates a random record expression, seed 262, number 6356.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06356 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = Head(<<1>>)] EXCEPT !.a = @ + ((TRUE \div 0) % (--1))] EXCEPT !.a = @ + (CASE (2147483647 < 7) -> Len(<<1, 2>>) [] OTHER -> Cardinality({1}) + (CHOOSE b9769 \in {7, 3} : (b9769 \in {1, 2})))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 118 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 115.
    | ExtendableExpr starting at line 14, column 99.
    | Expression starting at line 14, column 99.
    | ExtendableExpr starting at line 14, column 98.
    | ExtendableExpr starting at line 14, column 94.
    | Fatal errors while parsing TLA+ spec in file random_06356
    | In module random_06356
    | Could not parse module random_06356 from file random_06356.tla
    | *** Errors: 1
    | In module random_06356
    | Could not parse module random_06356 from file random_06356.tla
    3002:1 Parsing or semantic analysis failed.
---*)
