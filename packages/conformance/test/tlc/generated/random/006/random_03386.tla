(*---
description: Evaluates a random function expression, seed 262, number 3386.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03386 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = Len(<<>>)]).a :> ([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (--1)]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 144 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 141.
    | ExtendableExpr starting at line 14, column 137.
    | Expression starting at line 14, column 137.
    | Except Spec starting at line 14, column 131.
    | Some [] Form starting at line 14, column 90.
    | Fatal errors while parsing TLA+ spec in file random_03386
    | In module random_03386
    | Could not parse module random_03386 from file random_03386.tla
    | *** Errors: 1
    | In module random_03386
    | Could not parse module random_03386 from file random_03386.tla
    3002:1 Parsing or semantic analysis failed.
---*)
