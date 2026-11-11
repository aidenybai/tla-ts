(*---
description: Evaluates a random int expression, seed 262, number 7635.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07635 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([(0 :> 2) EXCEPT ![(2147483647 - 1)] = Head(<<1, 2>>)] @@ [(-1 .. 3) EXCEPT ![(7 \div 0)] = (2147483647 \div 0)]))[(([[a |-> 1] EXCEPT !.a = @ + 7]).a * ((-1 \div -1) - (-1 % 3)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 176 to line 14, col 179 of module random_07635 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 174.
    | Expression starting at line 14, column 173.
    | ExtendableExpr starting at line 14, column 172.
    | Expression starting at line 14, column 172.
    | ExtendableExpr starting at line 14, column 171.
    | Fatal errors while parsing TLA+ spec in file random_07635
    | In module random_07635
    | Could not parse module random_07635 from file random_07635.tla
    | *** Errors: 1
    | In module random_07635
    | Could not parse module random_07635 from file random_07635.tla
    3002:1 Parsing or semantic analysis failed.
---*)
