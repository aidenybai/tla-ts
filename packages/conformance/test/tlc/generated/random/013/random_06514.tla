(*---
description: Evaluates a random int expression, seed 262, number 6514.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06514 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-((Len(<<1>>) * (-2)) \div ((--1) % (CHOOSE b10015 \in {1} : FALSE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 48 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 45.
    | Expression starting at line 14, column 45.
    | ExtendableExpr starting at line 14, column 44.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Fatal errors while parsing TLA+ spec in file random_06514
    | In module random_06514
    | Could not parse module random_06514 from file random_06514.tla
    | *** Errors: 1
    | In module random_06514
    | Could not parse module random_06514 from file random_06514.tla
    3002:1 Parsing or semantic analysis failed.
---*)
