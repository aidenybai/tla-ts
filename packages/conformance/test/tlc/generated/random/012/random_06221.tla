(*---
description: Evaluates a random record expression, seed 262, number 6221.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06221 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[SortSeq(<<2, 7>>, LAMBDA p, q : p < q) EXCEPT !.a = @ + (~(\E b9577 \in SUBSET {1} : FALSE))] EXCEPT !.a = @ + ((CHOOSE f \in [{} -> 2..1] : TRUE))[((2147483647 \div -1) + Head(<<1, 2>>))]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 179 to line 14, col 182 of module random_06221 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 168.
    | Expression starting at line 14, column 168.
    | ExtendableExpr starting at line 14, column 167.
    | Expression starting at line 14, column 167.
    | ExtendableExpr starting at line 14, column 166.
    | Fatal errors while parsing TLA+ spec in file random_06221
    | In module random_06221
    | Could not parse module random_06221 from file random_06221.tla
    | *** Errors: 1
    | In module random_06221
    | Could not parse module random_06221 from file random_06221.tla
    3002:1 Parsing or semantic analysis failed.
---*)
