(*---
description: Evaluates a random seq expression, seed 262, number 6319.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06319 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(<<(-1 + <<1, 2>>), (--1)>>)))
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
    | Some << -- >> or >>_ Form starting at line 14, column 26.
    | ExtendableExpr starting at line 14, column 26.
    | Expression starting at line 14, column 26.
    | Fatal errors while parsing TLA+ spec in file random_06319
    | In module random_06319
    | Could not parse module random_06319 from file random_06319.tla
    | *** Errors: 1
    | In module random_06319
    | Could not parse module random_06319 from file random_06319.tla
    3002:1 Parsing or semantic analysis failed.
---*)
