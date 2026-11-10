(*---
description: Evaluates a random seq expression, seed 262, number 5867.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05867 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(((-1 \div -1) \div (3 \div 2147483647)) * (CHOOSE b9050 \in ({1} \ {1}) : (FALSE => TRUE))), ([[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + (2147483647 * 7)]).a>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 24 to line 14, col 27 of module random_05867 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 22.
    | Expression starting at line 14, column 21.
    | ExtendableExpr starting at line 14, column 20.
    | Expression starting at line 14, column 20.
    | ExtendableExpr starting at line 14, column 19.
    | Fatal errors while parsing TLA+ spec in file random_05867
    | In module random_05867
    | Could not parse module random_05867 from file random_05867.tla
    | *** Errors: 1
    | In module random_05867
    | Could not parse module random_05867 from file random_05867.tla
    3002:1 Parsing or semantic analysis failed.
---*)
