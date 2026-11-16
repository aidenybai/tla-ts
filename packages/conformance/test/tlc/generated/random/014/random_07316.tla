(*---
description: Evaluates a random record expression, seed 262, number 7316.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07316 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SubSeq((SubSeq(<<>>, 2147483647, 3) \o [<<1, 2>> EXCEPT ![1] = [a |-> 1]]), (Len(<<1, 2>>) * (-1 * -1)), ((7 + 7) - Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 118 to line 14, col 118 of module random_07316 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 116.
    | Expression starting at line 14, column 115.
    | ExtendableExpr starting at line 14, column 114.
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 98.
    | Fatal errors while parsing TLA+ spec in file random_07316
    | In module random_07316
    | Could not parse module random_07316 from file random_07316.tla
    | *** Errors: 1
    | In module random_07316
    | Could not parse module random_07316 from file random_07316.tla
    3002:1 Parsing or semantic analysis failed.
---*)
