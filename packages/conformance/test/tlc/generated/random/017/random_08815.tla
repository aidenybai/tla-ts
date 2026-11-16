(*---
description: Evaluates a random int expression, seed 262, number 8815.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08815 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Append(SubSeq(<<1>>, -1, 2), (3 * 3)))[(-Head(<<3, 1, 2>>))] % IF ([<<>> EXCEPT !.a = -1] = [[a |-> 1] EXCEPT !.a = @ + 0]) THEN (Len(<<3, 1, 2>>) - Head(<<>>)) ELSE IF (TRUE \/ FALSE) THEN (0 \div -1) ELSE ([a |-> 1, b |-> TRUE]).a))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 211 to line 14, col 214 of module random_08815 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 209.
    | Expression starting at line 14, column 209.
    | ExtendableExpr starting at line 14, column 208.
    | Expression starting at line 14, column 208.
    | IF THEN ELSE starting at line 14, column 184.
    | Fatal errors while parsing TLA+ spec in file random_08815
    | In module random_08815
    | Could not parse module random_08815 from file random_08815.tla
    | *** Errors: 1
    | In module random_08815
    | Could not parse module random_08815 from file random_08815.tla
    3002:1 Parsing or semantic analysis failed.
---*)
