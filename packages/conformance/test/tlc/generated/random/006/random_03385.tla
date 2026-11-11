(*---
description: Evaluates a random int expression, seed 262, number 3385.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03385 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE b5378 \in {(0 * -1), (-1)} : ((FALSE <=> FALSE) \/ (FALSE => TRUE))) \div Head(SubSeq((<<1, 2>> \o <<3, 1, 2>>), (<<5, 6>>)[2], (-2147483647)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 39 to line 14, col 39 of module random_03385 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 37.
    | Expression starting at line 14, column 37.
    | ExtendableExpr starting at line 14, column 36.
    | Expression starting at line 14, column 36.
    | Some { } form starting at line 14, column 35.
    | Fatal errors while parsing TLA+ spec in file random_03385
    | In module random_03385
    | Could not parse module random_03385 from file random_03385.tla
    | *** Errors: 1
    | In module random_03385
    | Could not parse module random_03385 from file random_03385.tla
    3002:1 Parsing or semantic analysis failed.
---*)
