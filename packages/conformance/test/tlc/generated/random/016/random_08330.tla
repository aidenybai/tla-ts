(*---
description: Evaluates a random set expression, seed 262, number 8330.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08330 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({[[[[a |-> 1] EXCEPT !.a = 2147483647] EXCEPT !.a = (1 \div 2147483647)] EXCEPT !.a = Head([<<3, 1, 2>> EXCEPT ![1] = 0])], Head(Append((<<>> \o <<>>), (-1 \div -1)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 172 to line 14, col 175 of module random_08330 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 170.
    | Expression starting at line 14, column 169.
    | ExtendableExpr starting at line 14, column 168.
    | Expression starting at line 14, column 168.
    | Optional Arguments starting at line 14, column 151.
    | Fatal errors while parsing TLA+ spec in file random_08330
    | In module random_08330
    | Could not parse module random_08330 from file random_08330.tla
    | *** Errors: 1
    | In module random_08330
    | Could not parse module random_08330 from file random_08330.tla
    3002:1 Parsing or semantic analysis failed.
---*)
