(*---
description: Evaluates a random set expression, seed 262, number 7769.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07769 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(([a |-> 1, b |-> TRUE]).a \div (CHOOSE b11985 \in 2..1 : TRUE))) .. Len(SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), Len(<<>>), (2 \div -1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 149 to line 14, col 152 of module random_07769 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 147.
    | Expression starting at line 14, column 147.
    | ExtendableExpr starting at line 14, column 146.
    | Expression starting at line 14, column 146.
    | Optional Arguments starting at line 14, column 98.
    | Fatal errors while parsing TLA+ spec in file random_07769
    | In module random_07769
    | Could not parse module random_07769 from file random_07769.tla
    | *** Errors: 1
    | In module random_07769
    | Could not parse module random_07769 from file random_07769.tla
    3002:1 Parsing or semantic analysis failed.
---*)
