(*---
description: Evaluates a random int expression, seed 262, number 1448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2147483647 - -1) * Head(<<3, 1, 2>>)) * IF ({1} = [a |-> 1]) THEN (<<1, 2>> \div -1) ELSE (TRUE - 3)) + Len(SubSeq((<<>> \o <<>>), (CHOOSE b2318 \in {2, 1, 3} : TRUE), Len(<<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 96 to line 14, col 99 of module random_01448 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 87.
    | Expression starting at line 14, column 87.
    | ExtendableExpr starting at line 14, column 86.
    | Expression starting at line 14, column 86.
    | IF THEN ELSE starting at line 14, column 60.
    | Fatal errors while parsing TLA+ spec in file random_01448
    | In module random_01448
    | Could not parse module random_01448 from file random_01448.tla
    | *** Errors: 1
    | In module random_01448
    | Could not parse module random_01448 from file random_01448.tla
    3002:1 Parsing or semantic analysis failed.
---*)
