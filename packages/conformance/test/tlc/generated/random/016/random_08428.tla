(*---
description: Evaluates a random record expression, seed 262, number 8428.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08428 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1] EXCEPT !.a = 7] EXCEPT !.a = (2 * <<3, 1, 2>>)] EXCEPT !.a = (Head(TRUE) + LET b13050 == 7 IN 3)] EXCEPT !.a = Len(<<([x \in Nat |-> x + 1] @@ [x \in Nat |-> x + 1]), (--1)>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 200 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 197.
    | Expression starting at line 14, column 197.
    | Some << -- >> or >>_ Form starting at line 14, column 145.
    | ExtendableExpr starting at line 14, column 145.
    | Expression starting at line 14, column 145.
    | Fatal errors while parsing TLA+ spec in file random_08428
    | In module random_08428
    | Could not parse module random_08428 from file random_08428.tla
    | *** Errors: 1
    | In module random_08428
    | Could not parse module random_08428 from file random_08428.tla
    3002:1 Parsing or semantic analysis failed.
---*)
