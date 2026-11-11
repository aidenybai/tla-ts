(*---
description: Evaluates a random set expression, seed 262, number 865.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00865 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN (IF (2 \in 2..1) THEN (0 \div 1) ELSE (2147483647 * -1) :> IF (TRUE => TRUE) THEN CASE <<>> -> 3 [] OTHER -> TRUE ELSE (2 + 1)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 73 to line 14, col 73 of module random_00865 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 62.
    | Expression starting at line 14, column 62.
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 61.
    | IF THEN ELSE starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_00865
    | In module random_00865
    | Could not parse module random_00865 from file random_00865.tla
    | *** Errors: 1
    | In module random_00865
    | Could not parse module random_00865 from file random_00865.tla
    3002:1 Parsing or semantic analysis failed.
---*)
